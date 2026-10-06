/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWallet } from 'ibax/auth';
import { TPersistedState } from 'lib/persistence';

const isStoredWallet = (value: unknown): value is IWallet => {
    const wallet = value as IWallet;
    return !!wallet
        && 'string' === typeof wallet.id
        && 'string' === typeof wallet.encKey
        && !!wallet.identities && 'object' === typeof wallet.identities;
};

// Wallets saved by earlier client versions (secp256r1 keys, crypto-js encryption, no per-suite
// identities) cannot be used with the current networks; they are dropped and reported.
export const dropUnusableWallets = (persisted: TPersistedState | null): TPersistedState | null => {
    const wallets = persisted && persisted.storage && persisted.storage.wallets;
    if (!Array.isArray(wallets)) {
        return persisted;
    }

    const usable = wallets.filter(isStoredWallet);
    if (usable.length !== wallets.length) {
        console.warn(`Dropped ${wallets.length - usable.length} stored wallet(s) saved in a format this version cannot use`);
    }
    return { ...persisted, storage: { ...persisted.storage, wallets: usable } };
};
