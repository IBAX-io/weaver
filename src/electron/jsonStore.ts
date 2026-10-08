/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// A small JSON settings file. Every write replaces the file atomically (write and flush a temporary
// file, then rename), so a crash or a power cut never leaves half a file; a file that cannot be
// read is moved aside, never overwritten, because it holds the user's stored wallets.
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from 'node:fs';
import path from 'node:path';

export class JsonStore<T extends object> {
    private _data: Partial<T> = {};
    // An unreadable file that could not be moved aside: it is left alone, so nothing is written
    private _readOnly = false;

    constructor(readonly file: string) {
        if (!existsSync(file)) {
            return;
        }
        try {
            const parsed = JSON.parse(readFileSync(file, 'utf8'));
            if (parsed && 'object' === typeof parsed && !Array.isArray(parsed)) {
                this._data = parsed;
                return;
            }
        }
        catch {
            // Unreadable: kept below under another name
        }
        try {
            renameSync(file, `${file}.unreadable-${Date.now()}`);
        }
        catch (error) {
            this._readOnly = true;
            console.error(`Settings file ${file} cannot be read or moved aside; nothing will be saved to it`, error);
        }
    }

    get<K extends keyof T>(key: K): T[K] | undefined {
        return this._data[key];
    }

    // Whether the value is on disk. A failed write (full disk, a file locked by a virus scanner)
    // keeps the value in memory and the previous file intact.
    set<K extends keyof T>(key: K, value: T[K]): boolean {
        this._data = { ...this._data, [key]: value };
        if (this._readOnly) {
            return false;
        }
        const temporary = `${this.file}.${process.pid}.tmp`;
        try {
            mkdirSync(path.dirname(this.file), { recursive: true });
            const descriptor = openSync(temporary, 'w', 0o600);
            try {
                writeSync(descriptor, JSON.stringify(this._data));
                fsyncSync(descriptor);
            }
            finally {
                closeSync(descriptor);
            }
            renameSync(temporary, this.file);
            return true;
        }
        catch (error) {
            rmSync(temporary, { force: true });
            console.error(`Settings could not be saved to ${this.file}`, error);
            return false;
        }
    }
}
