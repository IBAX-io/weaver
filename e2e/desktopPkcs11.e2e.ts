/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The built desktop app's PKCS#11 path as users run it: the page calls the bridge, the main
// process hands the call to its PKCS#11 host process, which loads the module (here SoftHSM, on a
// token store of its own) and answers. Skipped where SoftHSM is not installed.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { _electron, ElectronApplication, Page } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { p256 } from '@noble/curves/nist.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { IDesktopBridge } from 'ibax/gui';
import { createSoftHsmTokens, softHsmAvailable, softHsmModule, USER_PIN } from '../src/electron/pkcs11/softhsm';

declare global {
    interface Window {
        weaverDesktop: IDesktopBridge;
    }
}

const BUILD_DIR = fileURLToPath(new URL('../build', import.meta.url));
const TOKEN = 'weaver-desktop-e2e';

describe.runIf(softHsmAvailable())('desktop app with a PKCS#11 module', () => {
    let app: ElectronApplication;
    let page: Page;
    let cleanup: () => void;

    beforeAll(async () => {
        // Sets SOFTHSM2_CONF, which the app's host process inherits
        cleanup = createSoftHsmTokens([TOKEN]);
        app = await _electron.launch({ args: [BUILD_DIR, '--dry', '--pkcs11-module', softHsmModule()], env: { ...process.env } as { [key: string]: string } });
        page = await app.firstWindow();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('#root > *');
    }, 60000);

    afterAll(async () => {
        await app?.close();
        cleanup?.();
    });

    it('loads the module given at launch and lists its token', async () => {
        const found = await page.evaluate(async () => {
            const pkcs11 = window.weaverDesktop.pkcs11;
            return { module: await pkcs11.module(), tokens: await pkcs11.tokens(), frozen: Object.isFrozen(pkcs11) };
        });
        expect(found.frozen).toBe(true);
        expect(found.module).toMatchObject({ ok: true, value: { path: softHsmModule() } });
        expect(found.tokens.ok && found.tokens.value.map(token => token.label)).toContain(TOKEN);
    });

    it('says a wrong PIN as such, without throwing in the page', async () => {
        const result = await page.evaluate(async label => {
            const pkcs11 = window.weaverDesktop.pkcs11;
            const tokens = await pkcs11.tokens();
            const token = tokens.ok && tokens.value.find(item => label === item.label);
            return pkcs11.login(token.serial, '00000000');
        }, TOKEN);
        expect(result).toMatchObject({ ok: false, error: { code: 'E_PKCS11_PIN_INCORRECT' } });
    });

    it('generates a P-256 key on the token and signs with it; the signature verifies', async () => {
        const data = utf8ToBytes('LOGIN71234567');
        const result = await page.evaluate(async ({ label, pin, hex }) => {
            const pkcs11 = window.weaverDesktop.pkcs11;
            const tokens = await pkcs11.tokens();
            const token = tokens.ok && tokens.value.find(item => label === item.label);
            const login = await pkcs11.login(token.serial, pin);
            const key = await pkcs11.generateKey(token.serial, 'ECC_P256', 'desktop e2e');
            if (!login.ok || !key.ok) {
                return { login, key };
            }
            const signature = await pkcs11.sign({ token: token.serial, keyId: key.value.id, cryptoer: 'ECC_P256', hasher: 'SHA256', data: hex });
            const keys = await pkcs11.keys(token.serial);
            await pkcs11.logout(token.serial);
            return { login, key, signature, keys };
        }, { label: TOKEN, pin: USER_PIN, hex: bytesToHex(data) });

        expect(result.login.ok).toBe(true);
        expect(result.key.ok).toBe(true);
        const key = result.key.ok && result.key.value;
        expect(result.keys.ok && result.keys.value.map(item => item.id)).toContain(key.id);
        expect(result.signature.ok).toBe(true);
        const signature = result.signature.ok && result.signature.value;
        expect(p256.verify(hexToBytes(signature), sha256(data), hexToBytes(key.publicKey), { prehash: false, lowS: false })).toBe(true);
    });
});
