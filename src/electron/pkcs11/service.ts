/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The main process's side of the PKCS#11 module: starts the host process (host.ts) on first use
// with the configured module, forwards the page's requests, and starts it again after it ended
// (the module crashed): logins are lost then, and the page asks for the PIN again.
import { BrowserWindow, dialog, utilityProcess, UtilityProcess } from 'electron';
import { fileURLToPath } from 'node:url';
import { IPkcs11Module, TPkcs11Result } from 'ibax/pkcs11';
import config from '../config';
import args from '../args';
import { failure, IHostReply, TPkcs11Request } from './protocol';

const HOST = fileURLToPath(new URL('./pkcs11Host.js', import.meta.url));

interface IHost {
    process: UtilityProcess;
    pending: Map<number, (result: TPkcs11Result<unknown>) => void>;
    // The module's load, made before any other request
    loaded: Promise<TPkcs11Result<unknown>>;
}

let host: IHost | null = null;
let nextId = 1;
// --pkcs11-module, else the module chosen in the app
let modulePath: string | null = args.pkcs11Module || config.get('pkcs11Module') || null;

const send = (current: IHost, request: TPkcs11Request) => new Promise<TPkcs11Result<unknown>>(resolve => {
    const id = nextId++;
    current.pending.set(id, resolve);
    current.process.postMessage({ id, request });
});

const start = (path: string): IHost => {
    const child = utilityProcess.fork(HOST, [], { serviceName: 'Weaver PKCS#11', stdio: 'inherit' });
    const current: IHost = { process: child, pending: new Map(), loaded: null };
    child.on('message', ({ id, result }: IHostReply) => {
        const resolve = current.pending.get(id);
        current.pending.delete(id);
        resolve?.(result);
    });
    child.on('exit', code => {
        if (host === current) {
            host = null;
        }
        current.pending.forEach(resolve => resolve(failure('E_PKCS11_MODULE', `The PKCS#11 module's process ended (${code})`)));
        current.pending.clear();
    });
    current.loaded = send(current, { method: 'load', path });
    return current;
};

const stop = () => {
    const current = host;
    host = null;
    current?.process.kill();
};

const ready = async (): Promise<{ host: IHost } | { error: TPkcs11Result<never> }> => {
    if (!modulePath) {
        return { error: failure('E_PKCS11_NO_MODULE', 'No PKCS#11 module chosen') };
    }
    if (!host) {
        host = start(modulePath);
    }
    const current = host;
    const loaded = await current.loaded;
    if ('error' in loaded) {
        if (host === current) {
            stop();
        }
        return { error: loaded };
    }
    return { host: current };
};

export const request = async (call: TPkcs11Request): Promise<TPkcs11Result<unknown>> => {
    const state = await ready();
    return 'error' in state ? state.error : send(state.host, call);
};

export const moduleInfo = async (): Promise<TPkcs11Result<IPkcs11Module | null>> => {
    if (!modulePath) {
        return { ok: true, value: null };
    }
    const state = await ready();
    return 'error' in state ? state.error : state.host.loaded as Promise<TPkcs11Result<IPkcs11Module>>;
};

// Lets the user pick the module's library; kept only when it loads
export const chooseModule = async (window: BrowserWindow | null): Promise<TPkcs11Result<IPkcs11Module | null>> => {
    const extensions = 'win32' === process.platform ? ['dll'] : 'darwin' === process.platform ? ['dylib', 'so'] : ['so'];
    const options: Electron.OpenDialogOptions = {
        title: 'PKCS#11 module',
        properties: ['openFile'],
        filters: [{ name: 'PKCS#11 module', extensions }]
    };
    const chosen = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
    if (chosen.canceled || !chosen.filePaths.length) {
        return moduleInfo();
    }
    const previous = modulePath;
    stop();
    modulePath = chosen.filePaths[0];
    const info = await moduleInfo();
    if (info.ok) {
        config.set('pkcs11Module', modulePath);
    }
    else {
        modulePath = previous;
    }
    return info;
};

export const shutdown = stop;
