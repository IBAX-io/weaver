/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { defer, Observable, of } from 'rxjs';
import { catchError, exhaustMap, mergeMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { decryptPrivateKey, deriveIdentities } from 'lib/keyring';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { modalShow } from 'modules/modal/actions';
import { saveWallet } from 'modules/storage/actions';
import { enqueueNotification } from 'modules/notifications/actions';
import { enableWalletOnNetwork, loadWallets } from '../actions';
import { authFailureCode } from '../util/authErrors';

export const ENABLE_WALLET_MODAL = 'ENABLE_WALLET_ON_NETWORK';

// A wallet stored before the client supported this network's crypto suite has no identity (public
// key and account id) for it, and computing one takes the private key: its password decrypts the
// key, every supported suite's identity is computed again, and the wallet is saved with them. The
// key is not stored any other way. One at a time: the prompt has a fixed id.
const enableWalletOnNetworkEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(enableWalletOnNetwork.started),
    exhaustMap(action => ModalObservable<string>(action$, {
        modal: { id: ENABLE_WALLET_MODAL, type: 'AUTHORIZE', secret: true, params: { purpose: 'network' } },
        success: password => defer(() => decryptPrivateKey(action.payload.encKey, password)).pipe(
            mergeMap((privateKey): Observable<Action> => {
                if (!privateKey) {
                    return of(
                        enableWalletOnNetwork.failed({ params: action.payload, error: 'E_INVALID_PASSWORD' }),
                        enqueueNotification({ id: uuid.v4(), type: 'INVALID_PASSWORD', params: {} })
                    );
                }
                const wallet = { ...action.payload, identities: deriveIdentities(privateKey) };
                return of(
                    saveWallet(wallet),
                    enableWalletOnNetwork.done({ params: action.payload, result: wallet }),
                    loadWallets.started(null)
                );
            }),
            // A stored key this client cannot read (E_INVALID_KEY), or anything else
            catchError(error => of(
                enableWalletOnNetwork.failed({ params: action.payload, error: 'E_SERVER' }),
                modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: authFailureCode(error) } })
            ))
        ),
        failure: () => of(enableWalletOnNetwork.failed({ params: action.payload, error: 'E_CANCELLED' }))
    }))
);

export default enableWalletOnNetworkEpic;
