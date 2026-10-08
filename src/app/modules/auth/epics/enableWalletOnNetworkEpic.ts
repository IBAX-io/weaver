/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { cryptoSuiteKey, KeyNotUsableError } from 'lib/crypto/suites';
import { formatAddress } from 'lib/crypto/address';
import { decryptPrivateKey, deriveIdentities } from 'lib/keyring';
import { saveWallet } from 'modules/storage/actions';
import { enqueueNotification } from 'modules/notifications/actions';
import { enableWalletOnNetwork } from '../actions';
import { promptPassword } from '../util/passwordPrompt';

export const ENABLE_WALLET_MODAL = 'ENABLE_WALLET_ON_NETWORK';

// A wallet stored before the client supported this network's crypto suite has no identity (public
// key and account id) for it, and computing one takes the private key: its password decrypts the
// key, every supported suite's identity is computed again, and the wallet is saved with them (which
// lists it: loadSavedWalletEpic). The key is not stored any other way.
const enableWalletOnNetworkEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(enableWalletOnNetwork.started),
    exhaustMap(action => promptPassword(action$, {
        id: ENABLE_WALLET_MODAL,
        purpose: 'network',
        decrypt: password => decryptPrivateKey(action.payload.encKey, password),
        withKey: privateKey => {
            const wallet = { ...action.payload, identities: deriveIdentities(privateKey) };
            const session = state$.value.engine.guestSession;
            const identity = session && wallet.identities[cryptoSuiteKey(session.cryptoSuite)];
            // The key lies outside the network's curve: it has no address there, nothing is saved
            if (session && !identity) {
                throw new KeyNotUsableError(session.cryptoSuite);
            }
            return of(
                saveWallet(wallet),
                enableWalletOnNetwork.done({ params: action.payload, result: wallet }),
                ...(identity ? [enqueueNotification({ id: uuid.v4(), type: 'WALLET_ENABLED', params: { address: formatAddress(identity.keyID) } })] : [])
            );
        },
        failed: error => enableWalletOnNetwork.failed({ params: action.payload, error })
    }))
);

export default enableWalletOnNetworkEpic;
