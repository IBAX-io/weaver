/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Requests to the PKCS#11 host (host.ts) and their checks. Arguments come from the page: each is
// checked here before the module sees it.
import { IPkcs11SignRequest, TModuleCryptoer, TModuleHasher, TPkcs11ErrorCode, TPkcs11Result } from 'ibax/pkcs11';

export type TPkcs11Request =
    | { method: 'load', path: string }
    | { method: 'tokens' }
    | { method: 'login', serial: string, pin: string | null }
    | { method: 'logout', serial: string }
    | { method: 'keys', serial: string }
    | { method: 'generateKey', serial: string, cryptoer: TModuleCryptoer, label: string }
    | { method: 'sign', request: IPkcs11SignRequest };

export interface IHostRequest {
    id: number;
    request: TPkcs11Request;
}

export interface IHostReply {
    id: number;
    result: TPkcs11Result<unknown>;
}

export const MODULE_CRYPTOERS: TModuleCryptoer[] = ['ECC_P256', 'MLDSA65', 'MLDSA87'];
export const MODULE_HASHERS: TModuleHasher[] = ['SHA256', 'SHA384', 'SHA512', 'SHA3_256'];

export const failure = (code: TPkcs11ErrorCode, message: string): TPkcs11Result<never> => ({ ok: false, error: { code, message } });

const isText = (value: unknown, max: number, min = 0): value is string =>
    'string' === typeof value && value.length >= min && value.length <= max;
const isHex = (value: unknown, max: number): value is string =>
    isText(value, max, 2) && 0 === value.length % 2 && /^[0-9a-f]+$/i.test(value);
const isCryptoer = (value: unknown): value is TModuleCryptoer => MODULE_CRYPTOERS.includes(value as TModuleCryptoer);
const isHasher = (value: unknown): value is TModuleHasher => MODULE_HASHERS.includes(value as TModuleHasher);

// Token serial numbers are 16 characters; labels 32 bytes
const isSerial = (value: unknown): value is string => isText(value, 64, 1);

// The page's call as a host request; null for anything malformed. The page signs digests and
// short login messages: 4 KiB of data is far above both.
export const pageRequest = (method: unknown, values: unknown[]): TPkcs11Request | null => {
    const [first, second, third] = values;
    switch (method) {
        case 'tokens':
            return { method };
        case 'login':
            return isSerial(first) && (null === second || isText(second, 256)) ? { method, serial: first, pin: second as string | null } : null;
        case 'logout':
        case 'keys':
            return isSerial(first) ? { method, serial: first } : null;
        case 'generateKey':
            return isSerial(first) && isCryptoer(second) && isText(third, 64) ? { method, serial: first, cryptoer: second, label: third } : null;
        case 'sign': {
            const request = first as IPkcs11SignRequest;
            return request && 'object' === typeof request
                && isSerial(request.token)
                && isHex(request.keyId, 256)
                && isCryptoer(request.cryptoer)
                && isHasher(request.hasher)
                && isHex(request.data, 8192)
                ? { method, request: { token: request.token, keyId: request.keyId, cryptoer: request.cryptoer, hasher: request.hasher, data: request.data } }
                : null;
        }
        default:
            return null;
    }
};
