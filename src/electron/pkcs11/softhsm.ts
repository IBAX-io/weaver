/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// SoftHSM tokens for the tests: a fresh token store per run, so tests never see the user's own
// tokens. ML-DSA needs SoftHSM 2.7 or later.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PREFIX = path.join(os.homedir(), '.local', 'opt', 'softhsm2');
const LIBRARY = 'win32' === process.platform ? 'softhsm2.dll' : 'darwin' === process.platform ? 'libsofthsm2.dylib' : 'libsofthsm2.so';

export const SO_PIN = '12345678';
export const USER_PIN = '87654321';

// PKCS11_TEST_MODULE, or the SoftHSM installed under ~/.local/opt/softhsm2
export const softHsmModule = () => process.env.PKCS11_TEST_MODULE || path.join(PREFIX, 'lib', 'softhsm', LIBRARY);

const softHsmUtil = () => {
    const local = path.join(PREFIX, 'bin', 'softhsm2-util');
    return existsSync(local) ? local : 'softhsm2-util';
};

export const softHsmAvailable = () => {
    if (!existsSync(softHsmModule())) {
        return false;
    }
    try {
        execFileSync(softHsmUtil(), ['--version'], { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
};

// Points SoftHSM at a new token store holding the labelled tokens (user PIN USER_PIN); call
// before the module is loaded. Returns a cleanup.
export const createSoftHsmTokens = (labels: string[]) => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'weaver-softhsm-'));
    mkdirSync(path.join(dir, 'tokens'));
    const config = path.join(dir, 'softhsm2.conf');
    writeFileSync(config, `directories.tokendir = ${path.join(dir, 'tokens')}\nobjectstore.backend = file\nlog.level = ERROR\n`);
    const previous = process.env.SOFTHSM2_CONF;
    process.env.SOFTHSM2_CONF = config;
    labels.forEach(label => execFileSync(softHsmUtil(), ['--init-token', '--free', '--label', label, '--so-pin', SO_PIN, '--pin', USER_PIN], { stdio: 'ignore' }));
    return () => {
        if (undefined === previous) {
            delete process.env.SOFTHSM2_CONF;
        }
        else {
            process.env.SOFTHSM2_CONF = previous;
        }
        rmSync(dir, { recursive: true, force: true });
    };
};
