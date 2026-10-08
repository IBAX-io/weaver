/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// --dry runs on a throwaway profile: nothing is read from or written to the user's real data
// (config with the stored wallets, window bounds, browser storage). Must run before anything
// opens the config, so index.ts imports it first.
import { app } from 'electron';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import args from './args';
import { removeAbandonedProfiles, PROFILE_MARKER, PROFILE_PREFIX } from './util/dryProfiles';

// The real profile is used by one process at a time: two would each write their whole state over
// the other's (a wallet created in one lost to the other). A second start hands over to the first
// (index.ts focuses its window) and exits before anything reads or writes the profile.
if (!args.dry && !app.requestSingleInstanceLock()) {
    app.exit(0);
}

if (args.dry) {
    removeAbandonedProfiles(tmpdir());
    const profile = mkdtempSync(path.join(tmpdir(), PROFILE_PREFIX));
    writeFileSync(path.join(profile, PROFILE_MARKER), String(process.pid));
    app.setPath('userData', profile);
    // Everything but the marker goes at exit; whatever Chromium still writes afterwards is
    // removed by the next dry run, which finds the marker and no running process
    process.on('exit', () => {
        for (const name of readdirSync(profile)) {
            if (name !== PROFILE_MARKER) {
                rmSync(path.join(profile, name), { recursive: true, force: true });
            }
        }
    });
}
