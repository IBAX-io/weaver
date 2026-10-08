/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { defer, EMPTY, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { Epic, IRootState } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import ModalObservable from 'modules/modal/util/ModalObservable';
import TxObservable from 'modules/tx/util/TxObservable';
import { modalShow } from 'modules/modal/actions';
import { fetchBalance, ISendTransferCall, sendTransfer } from '../actions';
import { signedInSession } from 'modules/auth/selectors';

// The recipient's account on this network: a typo can still pass the address checksum (1 in 10),
// and coins sent to an id without an account are not owned by anyone yet
const describeConfirmation = (call: ISendTransferCall, hasAccount: boolean) => ({
    ...call.confirm,
    description: hasAccount || !call.unknownRecipientWarning
        ? call.confirm.description
        : `${call.confirm.description}\n\n${call.unknownRecipientWarning}`
});

// Whose wallet is open: the account and ecosystem a transfer is sent from and its result shown to
const walletOwner = (state: IRootState) => {
    const address = state.auth.wallet?.wallet?.address;
    const ecosystem = state.auth.wallet?.access?.ecosystem;
    return address && ecosystem ? { account: address, ecosystem } : null;
};

// Confirm, then sign and send like any transaction (password prompt, status polling, error modal),
// then report it and reload the balance. A transfer that finishes after the user signed out or
// switched account or ecosystem is reported to nobody: the wallet open by then belongs to someone
// else (its form and receipt are not this transfer's).
const sendTransferEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(sendTransfer.started),
    mergeMap((action): Observable<Action> => {
        const state = state$.value;
        const session = signedInSession(state);
        // Signed out of since it was asked for: nothing is sent, nothing is shown
        if (!session) {
            return of(sendTransfer.failed({ params: action.payload, error: { type: 'E_SIGNED_OUT', error: '' } }));
        }
        // The demo account's key is public (txCallEpic refuses it too)
        if (state.auth.isDefaultWallet) {
            return of(
                sendTransfer.failed({ params: action.payload, error: { type: 'E_GUEST_VIOLATION', error: '' } }),
                modalShow({ id: 'TX_ERROR', type: 'TX_ERROR', params: { type: 'E_GUEST_VIOLATION' } })
            );
        }

        const transfer = action.payload.transfer;
        const owner = walletOwner(state);
        const stillOpen = () => {
            const current = walletOwner(state$.value);
            return null !== owner && null !== current && current.account === owner.account && current.ecosystem === owner.ecosystem;
        };
        const recipientKnown$: Observable<boolean> = 'utxo' === transfer.type
            ? defer(() => api({ apiHost: session.network.apiHost }).keyinfo({ id: transfer.toID })).pipe(
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
                    success: transactions => stillOpen()
                        ? of(
                            sendTransfer.done({ params: action.payload, result: { hash: transactions[0] ? transactions[0].hash : '' } }),
                            fetchBalance.started(owner)
                        )
                        : EMPTY,
                    failure: error => stillOpen() ? of(sendTransfer.failed({ params: action.payload, error })) : EMPTY
                }),
                failure: () => of(sendTransfer.failed({ params: action.payload, error: null }))
            }))
        );
    })
);

export default sendTransferEpic;
