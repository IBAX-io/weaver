/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { defer, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import ModalObservable from 'modules/modal/util/ModalObservable';
import TxObservable from 'modules/tx/util/TxObservable';
import { modalShow } from 'modules/modal/actions';
import { fetchBalance, ISendTransferCall, sendTransfer } from '../actions';

// The recipient's account on this network: a typo can still pass the address checksum (1 in 10),
// and coins sent to an id without an account are not owned by anyone yet
const describeConfirmation = (call: ISendTransferCall, hasAccount: boolean) => ({
    ...call.confirm,
    description: hasAccount || !call.unknownRecipientWarning
        ? call.confirm.description
        : `${call.confirm.description}\n\n${call.unknownRecipientWarning}`
});

// Confirm, then sign and send like any transaction (password prompt, status polling, error modal),
// then reload the balance of whichever account is shown by then
const sendTransferEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(sendTransfer.started),
    mergeMap((action): Observable<Action> => {
        const state = state$.value;
        // The demo account's key is public (txCallEpic refuses it too)
        if (state.auth.isDefaultWallet) {
            return of(
                sendTransfer.failed({ params: action.payload, error: { type: 'E_GUEST_VIOLATION', error: '' } }),
                modalShow({ id: 'TX_ERROR', type: 'TX_ERROR', params: { type: 'E_GUEST_VIOLATION' } })
            );
        }

        const transfer = action.payload.transfer;
        const recipientKnown$: Observable<boolean> = 'utxo' === transfer.type
            ? defer(() => api({ apiHost: state.auth.session.network.apiHost }).keyinfo({ id: transfer.toID })).pipe(
                map(info => info.ecosystems.length > 0),
                // Not knowing is not a reason to warn
                catchError(() => of(true))
            )
            : of(true);

        return recipientKnown$.pipe(
            mergeMap(known => ModalObservable<boolean>(action$, {
                modal: { id: 'WALLET_TRANSFER_CONFIRM', type: 'CONFIRM', params: describeConfirmation(action.payload, known) },
                success: () => TxObservable(action$, {
                    tx: { uuid: uuid.v4(), contracts: [], transfers: [transfer] },
                    success: transactions => {
                        const current = state$.value.auth.wallet;
                        return of(
                            sendTransfer.done({ params: action.payload, result: { hash: transactions[0] ? transactions[0].hash : '' } }),
                            ...(current ? [fetchBalance.started({ account: current.wallet.address, ecosystem: current.access.ecosystem })] : [])
                        );
                    },
                    failure: error => of(sendTransfer.failed({ params: action.payload, error }))
                }),
                failure: () => of(sendTransfer.failed({ params: action.payload, error: null }))
            }))
        );
    })
);

export default sendTransferEpic;
