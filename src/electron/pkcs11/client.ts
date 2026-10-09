/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// A PKCS#11 (Cryptoki 3.2) client over koffi: loads a vendor module and uses its keys. Plain
// Node, no Electron: the desktop app runs it in a utility process (host.ts), the chain tests in
// their own process. Calls are synchronous; a token that waits for its PIN pad blocks the caller.
import { randomBytes } from 'node:crypto';
import koffi from 'koffi';
import type { LibraryHandle, TypeObject } from 'koffi';
import { IPkcs11Key, IPkcs11Module, IPkcs11SignRequest, IPkcs11Token, TModuleCryptoer, TModuleHasher, TPkcs11ErrorCode } from 'ibax/pkcs11';

const ULONG = 'unsigned long';
const ULONG_SIZE = koffi.sizeof(ULONG);
const PTR_SIZE = koffi.sizeof('void *');
// Cryptoki structs are packed to 1 byte on Windows, naturally aligned elsewhere
const pack = 'win32' === process.platform ? koffi.pack : koffi.struct;

const CK_VERSION = koffi.struct('CK_VERSION', { major: 'uint8_t', minor: 'uint8_t' });
const CK_INFO = pack('CK_INFO', {
    cryptokiVersion: CK_VERSION,
    manufacturerID: koffi.array('uint8_t', 32),
    flags: ULONG,
    libraryDescription: koffi.array('uint8_t', 32),
    libraryVersion: CK_VERSION
});
const CK_TOKEN_INFO = pack('CK_TOKEN_INFO', {
    label: koffi.array('uint8_t', 32),
    manufacturerID: koffi.array('uint8_t', 32),
    model: koffi.array('uint8_t', 16),
    serialNumber: koffi.array('uint8_t', 16),
    flags: ULONG,
    ulMaxSessionCount: ULONG,
    ulSessionCount: ULONG,
    ulMaxRwSessionCount: ULONG,
    ulRwSessionCount: ULONG,
    ulMaxPinLen: ULONG,
    ulMinPinLen: ULONG,
    ulTotalPublicMemory: ULONG,
    ulFreePublicMemory: ULONG,
    ulTotalPrivateMemory: ULONG,
    ulFreePrivateMemory: ULONG,
    hardwareVersion: CK_VERSION,
    firmwareVersion: CK_VERSION,
    utcTime: koffi.array('uint8_t', 16)
});
const CK_SESSION_INFO = pack('CK_SESSION_INFO', { slotID: ULONG, state: ULONG, flags: ULONG, ulDeviceError: ULONG });
const CK_C_INITIALIZE_ARGS = pack('CK_C_INITIALIZE_ARGS', {
    CreateMutex: 'void *',
    DestroyMutex: 'void *',
    LockMutex: 'void *',
    UnlockMutex: 'void *',
    flags: ULONG,
    pReserved: 'void *'
});
const CK_ATTRIBUTE = pack('CK_ATTRIBUTE', { type: ULONG, pValue: 'void *', ulValueLen: ULONG });
const CK_MECHANISM = pack('CK_MECHANISM', { mechanism: ULONG, pParameter: 'void *', ulParameterLen: ULONG });
const CK_SIGN_ADDITIONAL_CONTEXT = pack('CK_SIGN_ADDITIONAL_CONTEXT', { hedgeVariant: ULONG, pContext: 'void *', ulContextLen: ULONG });

// CK_FUNCTION_LIST: the version, then the function pointers in the order of the standard
const FUNCTIONS = {
    C_Initialize: [0, `${ULONG} C_Initialize(const CK_C_INITIALIZE_ARGS *args)`],
    C_Finalize: [1, `${ULONG} C_Finalize(void *reserved)`],
    C_GetInfo: [2, `${ULONG} C_GetInfo(_Out_ CK_INFO *info)`],
    C_GetSlotList: [4, `${ULONG} C_GetSlotList(uint8_t tokenPresent, _Out_ ${ULONG} *slots, _Inout_ ${ULONG} *count)`],
    C_GetTokenInfo: [6, `${ULONG} C_GetTokenInfo(${ULONG} slot, _Out_ CK_TOKEN_INFO *info)`],
    C_GetMechanismList: [7, `${ULONG} C_GetMechanismList(${ULONG} slot, _Out_ ${ULONG} *mechanisms, _Inout_ ${ULONG} *count)`],
    C_OpenSession: [12, `${ULONG} C_OpenSession(${ULONG} slot, ${ULONG} flags, void *application, void *notify, _Out_ ${ULONG} *session)`],
    C_CloseSession: [13, `${ULONG} C_CloseSession(${ULONG} session)`],
    C_GetSessionInfo: [15, `${ULONG} C_GetSessionInfo(${ULONG} session, _Out_ CK_SESSION_INFO *info)`],
    C_Login: [18, `${ULONG} C_Login(${ULONG} session, ${ULONG} userType, const uint8_t *pin, ${ULONG} pinLen)`],
    C_Logout: [19, `${ULONG} C_Logout(${ULONG} session)`],
    C_GetAttributeValue: [24, `${ULONG} C_GetAttributeValue(${ULONG} session, ${ULONG} object, _Inout_ CK_ATTRIBUTE *template, ${ULONG} count)`],
    C_FindObjectsInit: [26, `${ULONG} C_FindObjectsInit(${ULONG} session, const CK_ATTRIBUTE *template, ${ULONG} count)`],
    C_FindObjects: [27, `${ULONG} C_FindObjects(${ULONG} session, _Out_ ${ULONG} *objects, ${ULONG} max, _Out_ ${ULONG} *count)`],
    C_FindObjectsFinal: [28, `${ULONG} C_FindObjectsFinal(${ULONG} session)`],
    C_DigestInit: [37, `${ULONG} C_DigestInit(${ULONG} session, const CK_MECHANISM *mechanism)`],
    C_Digest: [38, `${ULONG} C_Digest(${ULONG} session, const uint8_t *data, ${ULONG} dataLen, _Out_ uint8_t *digest, _Inout_ ${ULONG} *digestLen)`],
    C_SignInit: [42, `${ULONG} C_SignInit(${ULONG} session, const CK_MECHANISM *mechanism, ${ULONG} key)`],
    C_Sign: [43, `${ULONG} C_Sign(${ULONG} session, const uint8_t *data, ${ULONG} dataLen, _Out_ uint8_t *signature, _Inout_ ${ULONG} *signatureLen)`],
    C_GenerateKeyPair: [59, `${ULONG} C_GenerateKeyPair(${ULONG} session, const CK_MECHANISM *mechanism, const CK_ATTRIBUTE *publicTemplate, ${ULONG} publicCount, const CK_ATTRIBUTE *privateTemplate, ${ULONG} privateCount, _Out_ ${ULONG} *publicKey, _Out_ ${ULONG} *privateKey)`],
    C_GenerateRandom: [64, `${ULONG} C_GenerateRandom(${ULONG} session, _Out_ uint8_t *data, ${ULONG} len)`]
} as const;
type TFunctionName = keyof typeof FUNCTIONS;
type TFunctions = { [name in TFunctionName]: (...args: any[]) => number };

// Prototypes are named types in koffi: declared once, used for every module loaded
const PROTOTYPES = Object.fromEntries(Object.entries(FUNCTIONS).map(([name, [, declaration]]) => [name, koffi.proto(declaration)])) as { [name in TFunctionName]: TypeObject };
// Offset of the first function pointer: after the 2-byte CK_VERSION, padded to a pointer except
// on Windows
const FUNCTIONS_OFFSET = 'win32' === process.platform ? 2 : koffi.offsetof(koffi.struct({ version: CK_VERSION, first: 'void *' }), 'first');

const CKR = {
    OK: 0x0,
    SLOT_ID_INVALID: 0x3,
    ATTRIBUTE_TYPE_INVALID: 0x12,
    ATTRIBUTE_VALUE_INVALID: 0x13,
    DEVICE_ERROR: 0x30,
    DEVICE_REMOVED: 0x32,
    FUNCTION_CANCELED: 0x50,
    KEY_HANDLE_INVALID: 0x60,
    KEY_TYPE_INCONSISTENT: 0x63,
    MECHANISM_INVALID: 0x70,
    MECHANISM_PARAM_INVALID: 0x71,
    OBJECT_HANDLE_INVALID: 0x82,
    PIN_INCORRECT: 0xA0,
    PIN_INVALID: 0xA1,
    PIN_LEN_RANGE: 0xA2,
    PIN_EXPIRED: 0xA3,
    PIN_LOCKED: 0xA4,
    SESSION_CLOSED: 0xB0,
    SESSION_HANDLE_INVALID: 0xB3,
    TEMPLATE_INCOMPLETE: 0xD0,
    TEMPLATE_INCONSISTENT: 0xD1,
    TOKEN_NOT_PRESENT: 0xE0,
    TOKEN_NOT_RECOGNIZED: 0xE1,
    USER_ALREADY_LOGGED_IN: 0x100,
    USER_NOT_LOGGED_IN: 0x101,
    DOMAIN_PARAMS_INVALID: 0x130,
    CRYPTOKI_ALREADY_INITIALIZED: 0x191
};

const CKF = {
    OS_LOCKING_OK: 0x2,
    RW_SESSION: 0x2,
    SERIAL_SESSION: 0x4,
    LOGIN_REQUIRED: 1 << 2,
    PROTECTED_AUTHENTICATION_PATH: 1 << 8,
    USER_PIN_FINAL_TRY: 1 << 17,
    USER_PIN_LOCKED: 1 << 18
};

const CKS_RO_USER_FUNCTIONS = 1;
const CKS_RW_USER_FUNCTIONS = 3;
const CKU_USER = 1;
const CKH_HEDGE_REQUIRED = 1;

const CKA = {
    CLASS: 0x0,
    TOKEN: 0x1,
    PRIVATE: 0x2,
    LABEL: 0x3,
    VALUE: 0x11,
    KEY_TYPE: 0x100,
    ID: 0x102,
    SENSITIVE: 0x103,
    SIGN: 0x108,
    VERIFY: 0x10A,
    PUBLIC_KEY_INFO: 0x129,
    EXTRACTABLE: 0x162,
    EC_PARAMS: 0x180,
    EC_POINT: 0x181,
    PARAMETER_SET: 0x61D
};

const CKO_PUBLIC_KEY = 2;
const CKO_PRIVATE_KEY = 3;
const CKK_EC = 0x3;
const CKK_ML_DSA = 0x4A;

const CKM = {
    EC_KEY_PAIR_GEN: 0x1040,
    ECDSA: 0x1041,
    ML_DSA_KEY_PAIR_GEN: 0x1C,
    ML_DSA: 0x1D,
    SHA256: 0x250,
    SHA384: 0x260,
    SHA512: 0x270,
    SHA3_256: 0x2B0
};

const ML_DSA_PARAMETER_SETS: { [cryptoer: string]: number } = { MLDSA65: 2, MLDSA87: 3 };
const ML_DSA_PUBLIC_KEY_SIZES: { [cryptoer: string]: number } = { MLDSA65: 1952, MLDSA87: 2592 };
const ML_DSA_SIGNATURE_SIZES: { [cryptoer: string]: number } = { MLDSA65: 3309, MLDSA87: 4627 };
// The context strings go-ibax asymalgo signs ML-DSA with
const ML_DSA_CONTEXTS: { [cryptoer: string]: string } = { MLDSA65: 'IBAX-MLDSA-65-v1', MLDSA87: 'IBAX-MLDSA-87-v1' };

const HASH_MECHANISMS: { [hasher in TModuleHasher]: number } = {
    SHA256: CKM.SHA256,
    SHA384: CKM.SHA384,
    SHA512: CKM.SHA512,
    SHA3_256: CKM.SHA3_256
};

// DER: the OID of P-256, the OIDs of the public key algorithms in a SubjectPublicKeyInfo
const P256_OID = Buffer.from('06082a8648ce3d030107', 'hex');
const EC_PUBLIC_KEY_OID = Buffer.from('06072a8648ce3d0201', 'hex');
const ML_DSA_OIDS: { [cryptoer: string]: Buffer } = {
    MLDSA65: Buffer.from('0609608648016503040312', 'hex'),
    MLDSA87: Buffer.from('0609608648016503040313', 'hex')
};

export class Pkcs11Error extends Error {
    readonly code: TPkcs11ErrorCode;
    // The module's return value, when the module failed
    readonly rv?: number;

    constructor(code: TPkcs11ErrorCode, message: string, rv?: number) {
        super(message);
        this.name = 'Pkcs11Error';
        this.code = code;
        this.rv = rv;
    }
}

const SESSION_LOST = [CKR.SESSION_CLOSED, CKR.SESSION_HANDLE_INVALID];
const TOKEN_LOST = [CKR.TOKEN_NOT_PRESENT, CKR.TOKEN_NOT_RECOGNIZED, CKR.DEVICE_REMOVED, CKR.SLOT_ID_INVALID];

const errorCode = (rv: number): TPkcs11ErrorCode => {
    switch (rv) {
        case CKR.PIN_INCORRECT:
        case CKR.PIN_INVALID:
        case CKR.PIN_LEN_RANGE:
            return 'E_PKCS11_PIN_INCORRECT';
        case CKR.PIN_LOCKED:
            return 'E_PKCS11_PIN_LOCKED';
        case CKR.PIN_EXPIRED:
            return 'E_PKCS11_PIN_EXPIRED';
        case CKR.USER_NOT_LOGGED_IN:
        case CKR.SESSION_CLOSED:
        case CKR.SESSION_HANDLE_INVALID:
            return 'E_PKCS11_NOT_LOGGED_IN';
        case CKR.TOKEN_NOT_PRESENT:
        case CKR.TOKEN_NOT_RECOGNIZED:
        case CKR.DEVICE_REMOVED:
        case CKR.SLOT_ID_INVALID:
            return 'E_PKCS11_TOKEN_ABSENT';
        case CKR.KEY_HANDLE_INVALID:
        case CKR.OBJECT_HANDLE_INVALID:
            return 'E_PKCS11_KEY_NOT_FOUND';
        case CKR.MECHANISM_INVALID:
        case CKR.MECHANISM_PARAM_INVALID:
        case CKR.DOMAIN_PARAMS_INVALID:
        case CKR.ATTRIBUTE_VALUE_INVALID:
        case CKR.TEMPLATE_INCONSISTENT:
        case CKR.TEMPLATE_INCOMPLETE:
        case CKR.KEY_TYPE_INCONSISTENT:
            return 'E_PKCS11_UNSUPPORTED';
        case CKR.FUNCTION_CANCELED:
            return 'E_PKCS11_CANCELLED';
        default:
            return 'E_PKCS11_MODULE';
    }
};

const check = (name: string, rv: number) => {
    if (CKR.OK !== rv) {
        throw new Pkcs11Error(errorCode(rv), `${name} failed: CKR 0x${rv.toString(16)}`, rv);
    }
};

// Space-padded UTF-8 fields of the info structs
const text = (field: number[]) => Buffer.from(field).toString('utf8').trimEnd();

// Native memory for attribute values and mechanism parameters, alive as long as the request
class Arena {
    private readonly blocks: unknown[] = [];

    bytes(value: Uint8Array) {
        const block = koffi.alloc('uint8_t', Math.max(value.length, 1));
        koffi.encode(block, 'uint8_t', Array.from(value), value.length);
        this.blocks.push(block);
        return block;
    }

    ulong(value: number) {
        const block = koffi.alloc(ULONG, 1);
        koffi.encode(block, ULONG, value);
        this.blocks.push(block);
        return block;
    }

    bool(value: boolean) {
        return this.bytes(Uint8Array.of(value ? 1 : 0));
    }

    struct(type: TypeObject, value: object) {
        const block = koffi.alloc(type, 1);
        koffi.encode(block, type, value);
        this.blocks.push(block);
        return block;
    }

    free() {
        this.blocks.splice(0).forEach(block => koffi.free(block));
    }
}

interface IAttribute {
    type: number;
    pValue: unknown;
    ulValueLen: number;
}

// A minimal DER reader: the tag, and the value's bounds, of the element at offset
const readElement = (der: Uint8Array, offset: number) => {
    if (offset + 2 > der.length) {
        return null;
    }
    const tag = der[offset];
    let length = der[offset + 1];
    let start = offset + 2;
    if (length & 0x80) {
        const count = length & 0x7f;
        if (count < 1 || count > 3 || start + count > der.length) {
            return null;
        }
        length = 0;
        for (let i = 0; i < count; i++) {
            length = (length << 8) | der[start + i];
        }
        start += count;
    }
    const end = start + length;
    return end > der.length ? null : { tag, start, end };
};

// The public key in a SubjectPublicKeyInfo: { algorithm { oid, parameters }, BIT STRING }
const parseSpki = (spki: Uint8Array) => {
    const outer = readElement(spki, 0);
    const algorithm = outer && 0x30 === outer.tag ? readElement(spki, outer.start) : null;
    const key = algorithm && 0x30 === algorithm.tag ? readElement(spki, algorithm.end) : null;
    if (!key || 0x03 !== key.tag || key.end !== outer.end || 0 !== spki[key.start]) {
        return null;
    }
    const oid = readElement(spki, algorithm.start);
    const parameters = oid && oid.end < algorithm.end ? spki.subarray(oid.end, algorithm.end) : new Uint8Array(0);
    return {
        algorithm: oid ? spki.subarray(algorithm.start, oid.end) : new Uint8Array(0),
        parameters,
        publicKey: spki.subarray(key.start + 1, key.end)
    };
};

// CKA_EC_POINT is a DER OCTET STRING; some modules give the bare point
const unwrapEcPoint = (value: Uint8Array) => {
    const element = readElement(value, 0);
    const point = element && 0x04 === element.tag && element.end === value.length && 65 === element.end - element.start
        ? value.subarray(element.start, element.end)
        : value;
    return 65 === point.length && 0x04 === point[0] ? point : null;
};

const equal = (a: Uint8Array, b: Uint8Array) => Buffer.from(a).equals(Buffer.from(b));

interface ISession {
    slot: number;
    handle: number;
}

export class Pkcs11Client {
    readonly info: IPkcs11Module;
    private readonly library: LibraryHandle;
    private readonly fn: TFunctions;
    // Whether this client initialized the module (and so finalizes it)
    private readonly initialized: boolean;
    // One read/write session per token, by serial number: the login state lives in it
    private readonly sessions = new Map<string, ISession>();

    private constructor(path: string, library: LibraryHandle, fn: TFunctions, initialized: boolean) {
        this.library = library;
        this.fn = fn;
        this.initialized = initialized;
        const info: any = {};
        check('C_GetInfo', fn.C_GetInfo(info));
        this.info = {
            path,
            manufacturer: text(info.manufacturerID),
            description: text(info.libraryDescription)
        };
    }

    static load(path: string) {
        let library: LibraryHandle;
        try {
            library = koffi.load(path);
        }
        catch (e) {
            throw new Pkcs11Error('E_PKCS11_NO_MODULE', `Cannot load ${path}: ${(e as Error).message}`);
        }
        try {
            let getFunctionList: (list: unknown[]) => number;
            try {
                getFunctionList = library.func(`${ULONG} C_GetFunctionList(_Out_ void **list)`);
            }
            catch (e) {
                throw new Pkcs11Error('E_PKCS11_NO_MODULE', `${path} is not a PKCS#11 module`);
            }
            const list: unknown[] = [null];
            check('C_GetFunctionList', getFunctionList(list));
            const fn = Object.fromEntries(Object.entries(FUNCTIONS).map(([name, [index]]) => {
                const pointer = koffi.decode(list[0], FUNCTIONS_OFFSET + index * PTR_SIZE, 'void *');
                return [name, koffi.decode(pointer, PROTOTYPES[name as TFunctionName])];
            })) as TFunctions;
            // The module may be called from any thread: let it use the OS's locks
            const rv = fn.C_Initialize({
                CreateMutex: null,
                DestroyMutex: null,
                LockMutex: null,
                UnlockMutex: null,
                flags: CKF.OS_LOCKING_OK,
                pReserved: null
            });
            if (CKR.CRYPTOKI_ALREADY_INITIALIZED !== rv) {
                check('C_Initialize', rv);
            }
            return new Pkcs11Client(path, library, fn, CKR.OK === rv);
        }
        catch (e) {
            library.unload();
            throw e;
        }
    }

    tokens(): IPkcs11Token[] {
        return this.slots().map(slot => {
            const info = this.tokenInfo(slot);
            const serial = text(info.serialNumber);
            const mechanisms = this.mechanisms(slot);
            const cryptoers: TModuleCryptoer[] = [];
            if (mechanisms.includes(CKM.ECDSA)) {
                cryptoers.push('ECC_P256');
            }
            if (mechanisms.includes(CKM.ML_DSA)) {
                cryptoers.push('MLDSA65', 'MLDSA87');
            }
            return {
                serial,
                label: text(info.label),
                manufacturer: text(info.manufacturerID),
                model: text(info.model),
                loggedIn: this.loggedIn(serial, info.flags),
                protectedAuthPath: !!(info.flags & CKF.PROTECTED_AUTHENTICATION_PATH),
                pinLocked: !!(info.flags & CKF.USER_PIN_LOCKED),
                pinFinalTry: !!(info.flags & CKF.USER_PIN_FINAL_TRY),
                cryptoers,
                hashers: (Object.keys(HASH_MECHANISMS) as TModuleHasher[]).filter(hasher => mechanisms.includes(HASH_MECHANISMS[hasher]))
            };
        });
    }

    // A null PIN logs in on the token's PIN pad
    login(serial: string, pin: string | null) {
        this.withSession(serial, session => {
            const value = null === pin ? null : Buffer.from(pin, 'utf8');
            const rv = this.fn.C_Login(session.handle, CKU_USER, value, value ? value.length : 0);
            if (CKR.USER_ALREADY_LOGGED_IN !== rv) {
                check('C_Login', rv);
            }
        });
    }

    logout(serial: string) {
        const session = this.sessions.get(serial);
        if (!session) {
            return;
        }
        const rv = this.fn.C_Logout(session.handle);
        this.closeSession(serial);
        if (CKR.USER_NOT_LOGGED_IN !== rv && !SESSION_LOST.includes(rv) && !TOKEN_LOST.includes(rv)) {
            check('C_Logout', rv);
        }
    }

    // The keys the token can sign with: its private keys allowed to sign, of the usable algorithms
    keys(serial: string): IPkcs11Key[] {
        return this.withSession(serial, session => {
            this.requireLogin(serial, session);
            const arena = new Arena();
            try {
                return this.findObjects(session, [
                    { type: CKA.CLASS, pValue: arena.ulong(CKO_PRIVATE_KEY), ulValueLen: ULONG_SIZE },
                    { type: CKA.SIGN, pValue: arena.bool(true), ulValueLen: 1 }
                ])
                    .map(privateKey => this.readKey(session, privateKey))
                    .filter(key => !!key);
            }
            finally {
                arena.free();
            }
        });
    }

    generateKey(serial: string, cryptoer: TModuleCryptoer, label: string): IPkcs11Key {
        return this.withSession(serial, session => {
            this.requireLogin(serial, session);
            const arena = new Arena();
            try {
                const id = this.random(session, 16);
                const labelBytes = Buffer.from(label, 'utf8');
                const common: IAttribute[] = [
                    { type: CKA.TOKEN, pValue: arena.bool(true), ulValueLen: 1 },
                    { type: CKA.ID, pValue: arena.bytes(id), ulValueLen: id.length },
                    { type: CKA.LABEL, pValue: arena.bytes(labelBytes), ulValueLen: labelBytes.length }
                ];
                const publicTemplate: IAttribute[] = [...common, { type: CKA.VERIFY, pValue: arena.bool(true), ulValueLen: 1 }];
                const privateTemplate: IAttribute[] = [
                    ...common,
                    { type: CKA.PRIVATE, pValue: arena.bool(true), ulValueLen: 1 },
                    { type: CKA.SENSITIVE, pValue: arena.bool(true), ulValueLen: 1 },
                    { type: CKA.EXTRACTABLE, pValue: arena.bool(false), ulValueLen: 1 },
                    { type: CKA.SIGN, pValue: arena.bool(true), ulValueLen: 1 }
                ];
                let mechanism: number;
                if ('ECC_P256' === cryptoer) {
                    publicTemplate.push({ type: CKA.EC_PARAMS, pValue: arena.bytes(P256_OID), ulValueLen: P256_OID.length });
                    mechanism = CKM.EC_KEY_PAIR_GEN;
                }
                else {
                    publicTemplate.push({ type: CKA.PARAMETER_SET, pValue: arena.ulong(ML_DSA_PARAMETER_SETS[cryptoer]), ulValueLen: ULONG_SIZE });
                    mechanism = CKM.ML_DSA_KEY_PAIR_GEN;
                }
                const publicKey = [0];
                const privateKey = [0];
                check('C_GenerateKeyPair', this.fn.C_GenerateKeyPair(
                    session.handle,
                    { mechanism, pParameter: null, ulParameterLen: 0 },
                    publicTemplate,
                    publicTemplate.length,
                    privateTemplate,
                    privateTemplate.length,
                    publicKey,
                    privateKey
                ));
                const key = this.readKey(session, privateKey[0]);
                if (!key) {
                    throw new Pkcs11Error('E_PKCS11_UNSUPPORTED', 'The generated key has no usable public key');
                }
                return key;
            }
            finally {
                arena.free();
            }
        });
    }

    // Hashes data with the hasher in the module and signs the digest with the key
    sign(request: IPkcs11SignRequest): string {
        return this.withSession(request.token, session => {
            this.requireLogin(request.token, session);
            const arena = new Arena();
            try {
                const id = Buffer.from(request.keyId, 'hex');
                const keyType = 'ECC_P256' === request.cryptoer ? CKK_EC : CKK_ML_DSA;
                const [key] = this.findObjects(session, [
                    { type: CKA.CLASS, pValue: arena.ulong(CKO_PRIVATE_KEY), ulValueLen: ULONG_SIZE },
                    { type: CKA.ID, pValue: arena.bytes(id), ulValueLen: id.length },
                    { type: CKA.KEY_TYPE, pValue: arena.ulong(keyType), ulValueLen: ULONG_SIZE }
                ], 1);
                if (undefined === key) {
                    throw new Pkcs11Error('E_PKCS11_KEY_NOT_FOUND', `No ${request.cryptoer} key ${request.keyId} on the token`);
                }

                check('C_DigestInit', this.fn.C_DigestInit(session.handle, { mechanism: HASH_MECHANISMS[request.hasher], pParameter: null, ulParameterLen: 0 }));
                const data = Buffer.from(request.data, 'hex');
                const digest = this.output('C_Digest', 64, (buffer, length) => this.fn.C_Digest(session.handle, data, data.length, buffer, length));

                let mechanism: object;
                let size: number;
                if ('ECC_P256' === request.cryptoer) {
                    mechanism = { mechanism: CKM.ECDSA, pParameter: null, ulParameterLen: 0 };
                    size = 64;
                }
                else {
                    // Pure ML-DSA, hedged, with the IBAX context string
                    const context = Buffer.from(ML_DSA_CONTEXTS[request.cryptoer], 'utf8');
                    mechanism = {
                        mechanism: CKM.ML_DSA,
                        pParameter: arena.struct(CK_SIGN_ADDITIONAL_CONTEXT, {
                            hedgeVariant: CKH_HEDGE_REQUIRED,
                            pContext: arena.bytes(context),
                            ulContextLen: context.length
                        }),
                        ulParameterLen: koffi.sizeof(CK_SIGN_ADDITIONAL_CONTEXT)
                    };
                    size = ML_DSA_SIGNATURE_SIZES[request.cryptoer];
                }
                check('C_SignInit', this.fn.C_SignInit(session.handle, mechanism, key));
                const signature = this.output('C_Sign', size, (buffer, length) => this.fn.C_Sign(session.handle, digest, digest.length, buffer, length));
                if (signature.length !== size) {
                    throw new Pkcs11Error('E_PKCS11_MODULE', `C_Sign returned ${signature.length} bytes, expected ${size}`);
                }
                return signature.toString('hex');
            }
            finally {
                arena.free();
            }
        });
    }

    close() {
        [...this.sessions.keys()].forEach(serial => this.closeSession(serial));
        if (this.initialized) {
            this.fn.C_Finalize(null);
        }
        this.library.unload();
    }

    private slots() {
        const count = [0];
        check('C_GetSlotList', this.fn.C_GetSlotList(1, null, count));
        const slots: number[] = new Array(count[0]).fill(0);
        check('C_GetSlotList', this.fn.C_GetSlotList(1, slots, count));
        return slots.slice(0, count[0]);
    }

    private tokenInfo(slot: number) {
        const info: any = {};
        check('C_GetTokenInfo', this.fn.C_GetTokenInfo(slot, info));
        return info;
    }

    private mechanisms(slot: number) {
        const count = [0];
        check('C_GetMechanismList', this.fn.C_GetMechanismList(slot, null, count));
        const mechanisms: number[] = new Array(count[0]).fill(0);
        check('C_GetMechanismList', this.fn.C_GetMechanismList(slot, mechanisms, count));
        return mechanisms.slice(0, count[0]);
    }

    private loggedIn(serial: string, flags: number) {
        if (!(flags & CKF.LOGIN_REQUIRED)) {
            return true;
        }
        const session = this.sessions.get(serial);
        if (!session) {
            return false;
        }
        const info: any = {};
        const rv = this.fn.C_GetSessionInfo(session.handle, info);
        if (CKR.OK !== rv) {
            this.closeSession(serial);
            return false;
        }
        return CKS_RO_USER_FUNCTIONS === info.state || CKS_RW_USER_FUNCTIONS === info.state;
    }

    private requireLogin(serial: string, session: ISession) {
        const info = this.tokenInfo(session.slot);
        if (!this.loggedIn(serial, info.flags)) {
            throw new Pkcs11Error('E_PKCS11_NOT_LOGGED_IN', `Not logged in to token ${serial}`);
        }
    }

    // Runs fn in the token's session, opened on first use; a session the module dropped (the
    // token was removed, or the module was reset) is forgotten, and with it the login
    private withSession<T>(serial: string, fn: (session: ISession) => T): T {
        let session = this.sessions.get(serial);
        if (!session) {
            const slot = this.slots().find(slot => text(this.tokenInfo(slot).serialNumber) === serial);
            if (undefined === slot) {
                throw new Pkcs11Error('E_PKCS11_TOKEN_ABSENT', `Token ${serial} is not present`);
            }
            const handle = [0];
            check('C_OpenSession', this.fn.C_OpenSession(slot, CKF.SERIAL_SESSION | CKF.RW_SESSION, null, null, handle));
            session = { slot, handle: handle[0] };
            this.sessions.set(serial, session);
        }
        try {
            return fn(session);
        }
        catch (e) {
            if (e instanceof Pkcs11Error && (SESSION_LOST.includes(e.rv) || TOKEN_LOST.includes(e.rv))) {
                this.closeSession(serial);
            }
            throw e;
        }
    }

    private closeSession(serial: string) {
        const session = this.sessions.get(serial);
        if (session) {
            this.sessions.delete(serial);
            this.fn.C_CloseSession(session.handle);
        }
    }

    private findObjects(session: ISession, template: IAttribute[], max = 64) {
        check('C_FindObjectsInit', this.fn.C_FindObjectsInit(session.handle, template, template.length));
        try {
            const objects: number[] = [];
            for (;;) {
                const batch: number[] = new Array(max).fill(0);
                const count = [0];
                check('C_FindObjects', this.fn.C_FindObjects(session.handle, batch, max, count));
                objects.push(...batch.slice(0, count[0]));
                if (count[0] < max || objects.length >= max) {
                    return objects;
                }
            }
        }
        finally {
            this.fn.C_FindObjectsFinal(session.handle);
        }
    }

    // An attribute's value, or null when the object does not have it
    private attribute(session: ISession, object: number, type: number): Buffer | null {
        const template = [{ type, pValue: null, ulValueLen: 0 }];
        const rv = this.fn.C_GetAttributeValue(session.handle, object, template, 1);
        if (SESSION_LOST.includes(rv) || TOKEN_LOST.includes(rv)) {
            check('C_GetAttributeValue', rv);
        }
        // The object lacks the attribute, or keeps it secret
        if (CKR.OK !== rv) {
            return null;
        }
        // CK_UNAVAILABLE_INFORMATION: an all-ones length
        const length = template[0].ulValueLen;
        if (length > 1 << 20) {
            return null;
        }
        const arena = new Arena();
        try {
            const value = arena.bytes(new Uint8Array(length));
            const filled = [{ type, pValue: value, ulValueLen: length }];
            check('C_GetAttributeValue', this.fn.C_GetAttributeValue(session.handle, object, filled, 1));
            return Buffer.from(koffi.decode(value, 'uint8_t', filled[0].ulValueLen) as number[]);
        }
        finally {
            arena.free();
        }
    }

    private ulongAttribute(session: ISession, object: number, type: number) {
        const value = this.attribute(session, object, type);
        return value && value.length === ULONG_SIZE ? Number(ULONG_SIZE === 8 ? value.readBigUInt64LE() : value.readUInt32LE()) : null;
    }

    // The key behind a private key object: its algorithm and public key, from the public key
    // object with the same CKA_ID or the private key's own CKA_PUBLIC_KEY_INFO; null when the key
    // is of an algorithm the network cannot use
    private readKey(session: ISession, privateKey: number): IPkcs11Key | null {
        const id = this.attribute(session, privateKey, CKA.ID);
        if (!id || !id.length) {
            return null;
        }
        const label = (this.attribute(session, privateKey, CKA.LABEL) || Buffer.alloc(0)).toString('utf8');
        const keyType = this.ulongAttribute(session, privateKey, CKA.KEY_TYPE);

        const arena = new Arena();
        let publicKeyObject: number | undefined;
        try {
            [publicKeyObject] = this.findObjects(session, [
                { type: CKA.CLASS, pValue: arena.ulong(CKO_PUBLIC_KEY), ulValueLen: ULONG_SIZE },
                { type: CKA.ID, pValue: arena.bytes(id), ulValueLen: id.length }
            ], 1);
        }
        finally {
            arena.free();
        }

        let found: { cryptoer: TModuleCryptoer, publicKey: Uint8Array } | null = null;
        if (undefined !== publicKeyObject) {
            found = this.publicKeyOf(session, publicKeyObject, keyType);
        }
        if (!found) {
            const spki = this.attribute(session, privateKey, CKA.PUBLIC_KEY_INFO);
            found = spki && spki.length ? this.publicKeyFromSpki(spki) : null;
        }
        return found ? { id: id.toString('hex'), label, cryptoer: found.cryptoer, publicKey: Buffer.from(found.publicKey).toString('hex') } : null;
    }

    private publicKeyOf(session: ISession, object: number, keyType: number | null) {
        if (CKK_EC === keyType) {
            const params = this.attribute(session, object, CKA.EC_PARAMS);
            const point = this.attribute(session, object, CKA.EC_POINT);
            const publicKey = params && point && equal(params, P256_OID) ? unwrapEcPoint(point) : null;
            return publicKey ? { cryptoer: 'ECC_P256' as TModuleCryptoer, publicKey } : null;
        }
        if (CKK_ML_DSA === keyType) {
            const parameterSet = this.ulongAttribute(session, object, CKA.PARAMETER_SET);
            const cryptoer = Object.keys(ML_DSA_PARAMETER_SETS).find(name => ML_DSA_PARAMETER_SETS[name] === parameterSet) as TModuleCryptoer;
            const publicKey = cryptoer ? this.attribute(session, object, CKA.VALUE) : null;
            return publicKey && publicKey.length === ML_DSA_PUBLIC_KEY_SIZES[cryptoer] ? { cryptoer, publicKey } : null;
        }
        return null;
    }

    private publicKeyFromSpki(spki: Uint8Array) {
        const parsed = parseSpki(spki);
        if (!parsed) {
            return null;
        }
        if (equal(parsed.algorithm, EC_PUBLIC_KEY_OID)) {
            const publicKey = equal(parsed.parameters, P256_OID) ? unwrapEcPoint(parsed.publicKey) : null;
            return publicKey ? { cryptoer: 'ECC_P256' as TModuleCryptoer, publicKey } : null;
        }
        const cryptoer = Object.keys(ML_DSA_OIDS).find(name => equal(parsed.algorithm, ML_DSA_OIDS[name])) as TModuleCryptoer;
        return cryptoer && parsed.publicKey.length === ML_DSA_PUBLIC_KEY_SIZES[cryptoer] ? { cryptoer, publicKey: parsed.publicKey } : null;
    }

    // Random bytes from the token, or from the OS when the token has no generator
    private random(session: ISession, length: number) {
        const buffer = Buffer.alloc(length);
        return CKR.OK === this.fn.C_GenerateRandom(session.handle, buffer, length) ? buffer : randomBytes(length);
    }

    private output(name: string, size: number, call: (buffer: Buffer, length: number[]) => number) {
        const buffer = Buffer.alloc(size);
        const length = [size];
        check(name, call(buffer, length));
        return buffer.subarray(0, length[0]);
    }
}
