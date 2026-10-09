/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Runs host requests on a Pkcs11Client, every outcome as a result: the desktop app's host
// process (host.ts) and the chain tests share it
import { TPkcs11Result } from 'ibax/pkcs11';
import { Pkcs11Client, Pkcs11Error } from './client';
import { failure, TPkcs11Request } from './protocol';

export type TPkcs11Dispatcher = ((request: TPkcs11Request) => TPkcs11Result<unknown>) & { close(): void };

export const createPkcs11Dispatcher = (): TPkcs11Dispatcher => {
    let client: Pkcs11Client | null = null;

    const run = (request: TPkcs11Request): unknown => {
        if ('load' === request.method) {
            client?.close();
            client = null;
            client = Pkcs11Client.load(request.path);
            return client.info;
        }
        if (!client) {
            throw new Pkcs11Error('E_PKCS11_NO_MODULE', 'No PKCS#11 module loaded');
        }
        switch (request.method) {
            case 'tokens':
                return client.tokens();
            case 'login':
                return client.login(request.serial, request.pin);
            case 'logout':
                return client.logout(request.serial);
            case 'keys':
                return client.keys(request.serial);
            case 'generateKey':
                return client.generateKey(request.serial, request.cryptoer, request.label);
            case 'sign':
                return client.sign(request.request);
        }
    };

    const dispatch = (request: TPkcs11Request): TPkcs11Result<unknown> => {
        try {
            return { ok: true, value: run(request) ?? null };
        }
        catch (e) {
            return e instanceof Pkcs11Error
                ? failure(e.code, e.message)
                : failure('E_PKCS11_MODULE', (e as Error)?.message || String(e));
        }
    };

    return Object.assign(dispatch, {
        close: () => {
            client?.close();
            client = null;
        }
    });
};
