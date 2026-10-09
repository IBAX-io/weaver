/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The user's PKCS#11 token for the chain tests in FIPS mode, where the client signs with a module
// key only: a SoftHSM token (see src/electron/pkcs11/softhsm.ts; ML-DSA needs SoftHSM 2.7) reached
// through the same dispatcher as the desktop app's host process, and the page's IPkcs11 over it
import { IModuleKeyRef } from 'ibax/auth';
import { IPkcs11, IPkcs11Bridge, TModuleCryptoer, TPkcs11Result } from 'ibax/pkcs11';
import { ICryptoSuiteId } from 'ibax/crypto';
import { pkcs11FromBridge } from 'lib/pkcs11';
import { createPkcs11Dispatcher } from '../../src/electron/pkcs11/dispatcher';
import { TPkcs11Request } from '../../src/electron/pkcs11/protocol';
import { createSoftHsmTokens, softHsmAvailable, softHsmModule, USER_PIN } from '../../src/electron/pkcs11/softhsm';

export { USER_PIN };

export interface ISoftToken {
    pkcs11: IPkcs11;
    serial: string;
    // A new key on the token for the suite's cryptoer; the token stays logged in
    generate(suite: ICryptoSuiteId, label: string): Promise<IModuleKeyRef>;
    close(): void;
}

export const startSoftToken = async (label: string): Promise<ISoftToken> => {
    if (!softHsmAvailable()) {
        throw new Error(`FIPS mode signs with a PKCS#11 module key: install SoftHSM 2.7 (${softHsmModule()}) or set PKCS11_TEST_MODULE`);
    }
    const cleanup = createSoftHsmTokens([label]);
    const dispatch = createPkcs11Dispatcher();
    const call = <T>(request: TPkcs11Request) => Promise.resolve(dispatch(request) as TPkcs11Result<T>);
    const bridge: IPkcs11Bridge = {
        module: () => call({ method: 'load', path: softHsmModule() }),
        chooseModule: () => call({ method: 'load', path: softHsmModule() }),
        tokens: () => call({ method: 'tokens' }),
        login: (serial, pin) => call({ method: 'login', serial, pin }),
        logout: serial => call({ method: 'logout', serial }),
        keys: serial => call({ method: 'keys', serial }),
        generateKey: (serial, cryptoer, keyLabel) => call({ method: 'generateKey', serial, cryptoer, label: keyLabel }),
        sign: request => call({ method: 'sign', request })
    };
    const pkcs11 = pkcs11FromBridge(bridge);
    await pkcs11.module();
    const token = (await pkcs11.tokens()).find(item => label === item.label);

    return {
        pkcs11,
        serial: token.serial,
        generate: async (suite, keyLabel) => {
            await pkcs11.login(token.serial, USER_PIN);
            const key = await pkcs11.generateKey(token.serial, suite.cryptoer as TModuleCryptoer, keyLabel);
            return { token: { serial: token.serial, label: token.label }, id: key.id, label: key.label, cryptoer: key.cryptoer, publicKey: key.publicKey };
        },
        close: () => {
            dispatch.close();
            cleanup();
        }
    };
};
