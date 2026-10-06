/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { removeAbandonedProfiles, PROFILE_MARKER } from './dryProfiles';

describe('removeAbandonedProfiles', () => {
    let dir: string;
    const make = (name: string, pid?: number) => {
        const profile = path.join(dir, name);
        mkdirSync(profile);
        writeFileSync(path.join(profile, 'Cookies'), '');
        if (undefined !== pid) {
            writeFileSync(path.join(profile, PROFILE_MARKER), String(pid));
        }
        return profile;
    };

    beforeEach(() => {
        dir = mkdtempSync(path.join(tmpdir(), 'weaver-profiles-test-'));
    });
    afterEach(() => rmSync(dir, { recursive: true, force: true }));

    it('removes our profiles whose process is gone (positive control)', () => {
        const abandoned = make('weaver-dry-abandoned', 2 ** 30);
        removeAbandonedProfiles(dir);
        expect(existsSync(abandoned)).toBe(false);
    });

    it('keeps profiles in use, and anything that is not ours', () => {
        const running = make('weaver-dry-running', process.pid);
        const unmarked = make('weaver-dry-unmarked');
        const other = make('other-app-profile', 2 ** 30);
        const victim = make('victim');
        symlinkSync(victim, path.join(dir, 'weaver-dry-link'));

        removeAbandonedProfiles(dir);

        for (const kept of [running, unmarked, other, victim]) {
            expect([kept, existsSync(kept)]).toEqual([kept, true]);
        }
        expect(existsSync(path.join(victim, 'Cookies'))).toBe(true);
    });
});
