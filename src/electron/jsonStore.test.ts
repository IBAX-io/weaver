/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { chmodSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JsonStore } from './jsonStore';

describe('JsonStore', () => {
    let dir: string;
    beforeEach(() => {
        dir = mkdtempSync(path.join(tmpdir(), 'weaver-store-test-'));
    });
    afterEach(() => {
        chmodSync(dir, 0o700);
        rmSync(dir, { recursive: true, force: true });
    });

    it('reads back what it wrote, leaving no temporary file', () => {
        const file = path.join(dir, 'nested', 'config.json');
        new JsonStore<{ a: number; b: string }>(file).set('a', 1);
        const store = new JsonStore<{ a: number; b: string }>(file);
        store.set('b', 'x');

        expect(new JsonStore<{ a: number; b: string }>(file).get('a')).toBe(1);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ a: 1, b: 'x' });
        expect(readdirSync(path.join(dir, 'nested'))).toEqual(['config.json']);
    });

    it('moves an unreadable file aside instead of overwriting it', () => {
        const file = path.join(dir, 'config.json');
        writeFileSync(file, '{"persistentData": "wallets", broken');
        const store = new JsonStore<{ a: number }>(file);
        store.set('a', 1);

        const kept = readdirSync(dir).find(name => name.startsWith('config.json.unreadable-'));
        expect(kept).toBeDefined();
        expect(readFileSync(path.join(dir, kept), 'utf8')).toBe('{"persistentData": "wallets", broken');
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ a: 1 });
    });

    it('reports a failed write without throwing, keeping the previous file', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const file = path.join(dir, 'config.json');
        const store = new JsonStore<{ a: number }>(file);
        expect(store.set('a', 1)).toBe(true);

        chmodSync(dir, 0o500);
        expect(store.set('a', 2)).toBe(false);
        expect(store.get('a')).toBe(2);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ a: 1 });
        expect(error).toHaveBeenCalled();
        error.mockRestore();
    });

    it('never writes over an unreadable file it could not move aside', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const file = path.join(dir, 'config.json');
        writeFileSync(file, '{"persistentData": "wallets", broken');
        chmodSync(dir, 0o500);

        const store = new JsonStore<{ a: number }>(file);
        expect(store.set('a', 1)).toBe(false);
        chmodSync(dir, 0o700);
        expect(store.set('a', 1)).toBe(false);
        expect(readFileSync(file, 'utf8')).toBe('{"persistentData": "wallets", broken');
        error.mockRestore();
    });
});
