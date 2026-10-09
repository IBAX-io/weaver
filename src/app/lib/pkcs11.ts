/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// PKCS#11 module keys as the page uses them: the desktop bridge's results, failures thrown as
// Pkcs11Error. Null in the browser, which has no access to a module.
import { IPkcs11, IPkcs11Bridge, TPkcs11ErrorCode, TPkcs11Result } from 'ibax/pkcs11';
import desktop from 'lib/desktop';

export class Pkcs11Error extends Error {
    readonly code: TPkcs11ErrorCode;

    constructor(code: TPkcs11ErrorCode, message: string) {
        super(message);
        this.name = 'Pkcs11Error';
        this.code = code;
    }
}

export const isPkcs11Error = (error: unknown): error is Pkcs11Error => error instanceof Pkcs11Error;

const unwrap = async <T>(result: Promise<TPkcs11Result<T>>): Promise<T> => {
    const outcome = await result;
    if ('error' in outcome) {
        throw new Pkcs11Error(outcome.error.code, outcome.error.message);
    }
    return outcome.value;
};

export const pkcs11FromBridge = (bridge: IPkcs11Bridge): IPkcs11 => ({
    module: () => unwrap(bridge.module()),
    chooseModule: () => unwrap(bridge.chooseModule()),
    tokens: () => unwrap(bridge.tokens()),
    login: (serial, pin) => unwrap(bridge.login(serial, pin)),
    logout: serial => unwrap(bridge.logout(serial)),
    keys: serial => unwrap(bridge.keys(serial)),
    generateKey: (serial, cryptoer, label) => unwrap(bridge.generateKey(serial, cryptoer, label)),
    sign: request => unwrap(bridge.sign(request))
});

const pkcs11: IPkcs11 | null = desktop?.pkcs11 ? pkcs11FromBridge(desktop.pkcs11) : null;

export default pkcs11;
