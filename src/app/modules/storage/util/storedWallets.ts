/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWallet } from 'ibax/auth';
import { TPersistedState } from 'lib/persistence';
import { cryptoSuiteKey, DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';

const isStoredWallet = (value: unknown): value is IWallet => {
    const wallet = value as IWallet;
    return !!wallet && 'object' === typeof wallet
        && 'string' === typeof wallet.id
        && 'string' === typeof wallet.encKey
        && !!wallet.identities && 'object' === typeof wallet.identities
        && !!wallet.identities[cryptoSuiteKey(DEFAULT_CRYPTO_SUITE)];
};

// A stored list as a list; anything else (damaged data) is kept as its only entry, never dropped
const asList = (value: unknown): unknown[] => Array.isArray(value) ? value : undefined === value || null === value ? [] : [value];

// Stored wallets this version cannot use as is (saved by earlier versions, or damaged) are moved
// to storage.legacyWallets exactly as they were. Nothing is ever dropped: they hold the user's
// only copy of a private key. Legacy ones can be upgraded from the login screen.
export const quarantineUnusableWallets = (persisted: TPersistedState | null): TPersistedState | null => {
    const storage = persisted && persisted.storage;
    if (!storage || 'object' !== typeof storage) {
        return persisted;
    }

    const wallets = asList(storage.wallets);
    const usable = wallets.filter(isStoredWallet);
    const listsIntact = (undefined === storage.wallets || Array.isArray(storage.wallets))
        && (undefined === storage.legacyWallets || Array.isArray(storage.legacyWallets));
    if (listsIntact && usable.length === wallets.length) {
        return persisted;
    }

    const quarantined = asList(storage.legacyWallets);
    const known = new Set(quarantined.map(wallet => JSON.stringify(wallet)));
    const moved = wallets.filter(wallet => !isStoredWallet(wallet) && !known.has(JSON.stringify(wallet)));
    return { ...persisted, storage: { ...storage, wallets: usable, legacyWallets: [...quarantined, ...moved] } };
};
