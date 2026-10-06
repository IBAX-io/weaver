/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import uuid from 'uuid';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import ModalObservable from 'modules/modal/util/ModalObservable';
import TxObservable from 'modules/tx/util/TxObservable';
import { modalShow } from 'modules/modal/actions';
import { fetchBalance, sendTransfer } from '../actions';

// Confirm, then sign and send like any transaction (password prompt, status polling, error modal),
// then reload the balance
const sendTransferEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(sendTransfer.started),
    mergeMap((action): Observable<Action> => {
        const state = state$.value;
        // The demo account's key is public
        if (state.auth.isDefaultWallet) {
            return of(
                sendTransfer.failed({ params: action.payload, error: { type: 'E_GUEST_VIOLATION', error: '' } }),
                modalShow({ id: 'TX_ERROR', type: 'TX_ERROR', params: { type: 'E_GUEST_VIOLATION' } })
            );
        }
        const owner = {
            account: state.auth.wallet.wallet.address,
            ecosystem: state.auth.wallet.access.ecosystem
        };

        return ModalObservable<boolean>(action$, {
            modal: { id: 'WALLET_TRANSFER_CONFIRM', type: 'CONFIRM', params: action.payload.confirm },
            success: () => TxObservable(action$, {
                tx: { uuid: uuid.v4(), contracts: [], transfers: [action.payload.transfer] },
                success: () => of(
                    sendTransfer.done({ params: action.payload }),
                    fetchBalance.started(owner)
                ),
                failure: error => of(sendTransfer.failed({ params: action.payload, error }))
            }),
            failure: () => of(sendTransfer.failed({ params: action.payload, error: null }))
        });
    })
);

export default sendTransferEpic;
