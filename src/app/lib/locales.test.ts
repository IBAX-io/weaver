/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DISPLAYABLE_AUTH_ERRORS } from 'modules/auth/epics/acquireSessionEpic';

// Locale files are fetched at runtime by setLocaleEpic; an invalid file silently falls back to
// no messages, so validate them here.
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '../../../public/locales');
const localeFiles: string[] = fs.readdirSync(LOCALES_DIR).filter((f: string) => f.endsWith('.json') && f !== 'index.json');
const load = (file: string) => JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));

describe('locales', () => {
    it('rejects an unescaped ASCII quote (positive control)', () => {
        expect(() => JSON.parse('{ "a": "点击"创建"按钮" }')).toThrow();
    });

    it.each(localeFiles)('%s is valid JSON', file => {
        expect(() => load(file)).not.toThrow();
    });

    it('every enabled locale in index.json has a file', () => {
        const index = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'index.json'), 'utf8'));
        const enabled = index.locales.filter((l: any) => l.enabled);
        expect(enabled.length).toBeGreaterThan(0);
        enabled.forEach((l: any) => {
            expect(localeFiles).toContain(`${l.key}.json`);
        });
    });

    it.each(localeFiles)('%s has the same keys as en-US', file => {
        const reference = Object.keys(load('en-US.json')).sort();
        expect(Object.keys(load(file)).sort()).toEqual(reference);
    });

    it.each(localeFiles)('%s translates every displayable auth error', file => {
        const messages = load(file);
        DISPLAYABLE_AUTH_ERRORS.forEach(code => {
            expect(messages).toHaveProperty([`auth.error.${code}`]);
        });
    });
});
