/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Keys held in a PKCS#11 module (an HSM, a smart card or a USB token), used by the desktop app.
// The private key never leaves the module: the app asks the module to hash and sign.
declare module 'ibax/pkcs11' {
    // The cryptoers and hashers a module key can serve: the FIPS-approved ones go-ibax implements
    type TModuleCryptoer = 'ECC_P256' | 'MLDSA65' | 'MLDSA87';
    type TModuleHasher = 'SHA256' | 'SHA384' | 'SHA512' | 'SHA3_256';

    type TPkcs11ErrorCode =
        // No module configured, or it cannot be loaded
        | 'E_PKCS11_NO_MODULE'
        | 'E_PKCS11_TOKEN_ABSENT'
        | 'E_PKCS11_PIN_INCORRECT'
        | 'E_PKCS11_PIN_LOCKED'
        | 'E_PKCS11_PIN_EXPIRED'
        | 'E_PKCS11_NOT_LOGGED_IN'
        | 'E_PKCS11_KEY_NOT_FOUND'
        // The module lacks a mechanism, a curve or a parameter set the request needs
        | 'E_PKCS11_UNSUPPORTED'
        // Cancelled on the token (a PIN pad, a touch confirmation)
        | 'E_PKCS11_CANCELLED'
        | 'E_PKCS11_INVALID_ARGUMENT'
        // Any other failure of the module, or the module's process ended
        | 'E_PKCS11_MODULE';

    // Why a signer signed nothing (lib/crypto/signer): the module's refusal, a key in memory on a
    // FIPS network, or a module key where no module can be reached (the web app)
    type TSignerErrorCode = TPkcs11ErrorCode | 'E_FIPS_SIGNER_REQUIRED' | 'E_PKCS11_UNAVAILABLE';

    interface IPkcs11Error {
        code: TPkcs11ErrorCode;
        message: string;
    }

    type TPkcs11Result<T> = { ok: true, value: T } | { ok: false, error: IPkcs11Error };

    interface IPkcs11Module {
        path: string;
        manufacturer: string;
        description: string;
    }

    interface IPkcs11Token {
        serial: string;
        label: string;
        manufacturer: string;
        model: string;
        loggedIn: boolean;
        // The PIN is entered on the token's own PIN pad, not in the app
        protectedAuthPath: boolean;
        pinLocked: boolean;
        pinFinalTry: boolean;
        cryptoers: TModuleCryptoer[];
        hashers: TModuleHasher[];
    }

    interface IPkcs11Key {
        // CKA_ID, hex
        id: string;
        label: string;
        cryptoer: TModuleCryptoer;
        // Hex: uncompressed with the 04 prefix for P-256, the raw encoding for ML-DSA
        publicKey: string;
    }

    interface IPkcs11SignRequest {
        // Token serial number
        token: string;
        keyId: string;
        cryptoer: TModuleCryptoer;
        hasher: TModuleHasher;
        // Hex; the module hashes it with the hasher and signs the digest
        data: string;
    }

    // What the main process exposes: every call resolves, failures as results (an error thrown
    // across the context bridge loses its code)
    interface IPkcs11Bridge {
        module(): Promise<TPkcs11Result<IPkcs11Module | null>>;
        chooseModule(): Promise<TPkcs11Result<IPkcs11Module | null>>;
        tokens(): Promise<TPkcs11Result<IPkcs11Token[]>>;
        login(serial: string, pin: string | null): Promise<TPkcs11Result<void>>;
        logout(serial: string): Promise<TPkcs11Result<void>>;
        keys(serial: string): Promise<TPkcs11Result<IPkcs11Key[]>>;
        generateKey(serial: string, cryptoer: TModuleCryptoer, label: string): Promise<TPkcs11Result<IPkcs11Key>>;
        // Signature, hex: r || s for P-256, the ML-DSA signature for ML-DSA
        sign(request: IPkcs11SignRequest): Promise<TPkcs11Result<string>>;
    }

    // The same calls as the page uses them: failures throw Pkcs11Error (src/app/lib/pkcs11)
    interface IPkcs11 {
        module(): Promise<IPkcs11Module | null>;
        chooseModule(): Promise<IPkcs11Module | null>;
        tokens(): Promise<IPkcs11Token[]>;
        login(serial: string, pin: string | null): Promise<void>;
        logout(serial: string): Promise<void>;
        keys(serial: string): Promise<IPkcs11Key[]>;
        generateKey(serial: string, cryptoer: TModuleCryptoer, label: string): Promise<IPkcs11Key>;
        sign(request: IPkcs11SignRequest): Promise<string>;
    }
}
