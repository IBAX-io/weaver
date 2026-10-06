/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWallet, IWalletIdentity } from 'ibax/auth';
import { IAccount, IKeyInfo } from 'ibax/api';
import { cryptoSuiteKey, ICryptoSuiteId, UnsupportedCryptoSuiteError } from 'lib/crypto/suites';

// The stored wallet's identity (public key + account id) on a network with the given suite
export const walletIdentity = (wallet: IWallet, suite: ICryptoSuiteId): IWalletIdentity => {
    const identity = wallet.identities[cryptoSuiteKey(suite)];
    if (!identity) {
        throw new UnsupportedCryptoSuiteError(suite);
    }
    return identity;
};

export const walletAccount = (wallet: IWallet, suite: ICryptoSuiteId, keyInfo: IKeyInfo): IAccount => {
    const identity = walletIdentity(wallet, suite);
    return {
        id: identity.keyID,
        walletID: wallet.id,
        address: keyInfo.account,
        encKey: wallet.encKey,
        publicKey: identity.publicKey,
        access: keyInfo.ecosystems.map(key => ({
            ...key,
            roles: key.roles || []
        }))
    };
};
