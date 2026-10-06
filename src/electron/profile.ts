/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// --dry runs on a throwaway profile: nothing is read from or written to the user's real data
// (config with the stored wallets, window bounds, browser storage). Must run before anything
// opens the config, so index.ts imports it first.
import { app } from 'electron';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import args from './args';

const PREFIX = 'weaver-dry-';
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

// Chromium's network service writes a little cache metadata after the main process is gone, so
// the exit cleanup can leave a near-empty folder behind; clear out old ones on the next dry run
const removeStaleProfiles = (dir: string) => {
    for (const name of readdirSync(dir)) {
        const profile = path.join(dir, name);
        try {
            if (name.startsWith(PREFIX) && Date.now() - statSync(profile).mtimeMs > STALE_AFTER_MS) {
                rmSync(profile, { recursive: true, force: true });
            }
        }
        catch {
            // Another dry run removed it first
        }
    }
};

if (args.dry) {
    removeStaleProfiles(tmpdir());
    const profile = mkdtempSync(path.join(tmpdir(), PREFIX));
    app.setPath('userData', profile);
    process.on('exit', () => {
        rmSync(profile, { recursive: true, force: true });
    });
}
