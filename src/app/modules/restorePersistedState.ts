/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { discardStaleSessions, TPersistedState } from 'lib/persistence';
import { quarantineUnusableWallets } from 'modules/storage/util/storedWallets';

// What the app stored, as this version starts from it (store.ts)
export const restorePersistedState = (persisted: TPersistedState | null) =>
    discardStaleSessions(quarantineUnusableWallets(persisted));
