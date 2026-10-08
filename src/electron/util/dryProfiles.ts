/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { lstatSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

export const PROFILE_PREFIX = 'weaver-dry-';
// Written into every dry-run profile: the pid of the Weaver process using it
export const PROFILE_MARKER = '.weaver-dry-profile';

const isRunning = (pid: number) => {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch (e) {
        // EPERM: the process exists but belongs to someone else
        return (e as NodeJS.ErrnoException).code === 'EPERM';
    }
};

// Chromium's network service writes a little cache metadata after the main process is gone, so
// the exit cleanup can leave a near-empty folder behind. Removed here: only real directories
// (not links) that carry our marker and whose Weaver process is gone.
export const removeAbandonedProfiles = (dir: string) => {
    for (const name of readdirSync(dir)) {
        if (!name.startsWith(PROFILE_PREFIX)) {
            continue;
        }
        const profile = path.join(dir, name);
        try {
            if (!lstatSync(profile).isDirectory()) {
                continue;
            }
            const pid = Number(readFileSync(path.join(profile, PROFILE_MARKER), 'utf8'));
            if (Number.isSafeInteger(pid) && pid > 0 && !isRunning(pid)) {
                rmSync(profile, { recursive: true, force: true });
            }
        }
        catch {
            // No marker (not ours, or the leftover of a profile already cleaned up): left alone
        }
    }
};
