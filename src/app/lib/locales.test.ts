/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { DISPLAYABLE_AUTH_ERRORS } from 'modules/auth/util/authErrors';
import { AMOUNT_CHECK_PROBLEMS, RECIPIENT_PROBLEMS } from 'components/Main/Wallet/validation';
import { WALLET_ERRORS } from 'modules/wallet/actions';
import { THistoryFilter } from 'modules/wallet/history';
import { TTransferSelfDirection, TTxError } from 'ibax/tx';

// Locale files are fetched at runtime by setLocaleEpic; an invalid file silently falls back to
// no messages, so validate them here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOCALES_DIR = path.resolve(__dirname, '../../../public/locales');
const localeFiles: string[] = fs.readdirSync(LOCALES_DIR).filter((f: string) => f.endsWith('.json') && f !== 'index.json');
const load = (file: string) => JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));

// Every value of these unions; the compiler fails this file when one is added and not listed here
const TX_ERRORS = [
    'error', 'info', 'warning', 'panic', 'E_GUEST_VIOLATION', 'E_AUTH_CANCELLED', 'E_INVALID_TRANSFER', 'E_INVALID_PARAM',
    'E_UNSUPPORTED_PARAM', 'E_INSUFFICIENT_BALANCE', 'E_TX_TIMEOUT', 'E_PENALTY', 'E_DUPLICATE_TX', 'E_CONTRACT', 'E_SERVER', 'E_CRYPTO_CHANGED', 'E_TOKENEXPIRED', 'E_SIGNED_OUT'
] as const satisfies readonly TTxError[];
const TX_ERRORS_COMPLETE: [Exclude<TTxError, typeof TX_ERRORS[number]>] extends [never] ? true : false = true;
const DIRECTIONS = ['toAccount', 'toUTXO'] as const satisfies readonly TTransferSelfDirection[];
const DIRECTIONS_COMPLETE: [Exclude<TTransferSelfDirection, typeof DIRECTIONS[number]>] extends [never] ? true : false = true;

// Messages the app looks up by a code it builds at runtime (ErrorModal, the wallet page)
const BUILT_KEYS = [
    // Never shown: E_AUTH_CANCELLED and E_SIGNED_OUT (nothing to say), E_CRYPTO_CHANGED and
    // E_TOKENEXPIRED (the sign-in page says it)
    ...TX_ERRORS.filter(code => !['E_AUTH_CANCELLED', 'E_CRYPTO_CHANGED', 'E_TOKENEXPIRED', 'E_SIGNED_OUT'].includes(code)).map(code => `tx.error.${code}`),
    ...AMOUNT_CHECK_PROBLEMS.map(problem => `wallet.error.${problem}`),
    ...RECIPIENT_PROBLEMS.map(problem => `wallet.error.recipient.${problem}`),
    ...WALLET_ERRORS.map(code => `wallet.balance.error.${code}`),
    ...WALLET_ERRORS.map(code => `wallet.history.error.${code}`),
    ...WALLET_ERRORS.map(code => `wallet.utxoHistory.error.${code}`),
    ...(['transfers', 'fees', 'all'] as const satisfies readonly THistoryFilter[]).map(filter => `wallet.history.empty.${filter}`),
    ...DIRECTIONS.map(direction => `wallet.done.${direction}`)
];

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

    it.each(localeFiles)('%s has every message the app looks up by a built key', file => {
        expect(TX_ERRORS_COMPLETE && DIRECTIONS_COMPLETE).toBe(true);
        const messages = load(file);
        expect(BUILT_KEYS.filter(key => !(key in messages))).toEqual([]);
    });

    it.each(localeFiles)('%s dates its copyright to the current year, not a fixed one', file => {
        expect(load(file)['legal.copy']).toContain('{year}');
    });

    it.each(localeFiles)('%s translates every displayable auth error', file => {
        const messages = load(file);
        DISPLAYABLE_AUTH_ERRORS.forEach(code => {
            expect(messages).toHaveProperty([`auth.error.${code}`]);
        });
    });
});
