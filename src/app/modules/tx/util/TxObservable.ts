/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action as ReduxAction } from 'redux';
import { Observable } from 'rxjs';
import { ActionsObservable } from 'redux-observable';
import { txCall, txExec } from '../actions';
import { ITransactionCall, ITxError, ITransaction } from 'ibax/tx';
import { isType } from 'typescript-fsa';

type TTxDoneAction =
    ReturnType<typeof txExec.done> |
    ReturnType<typeof txExec.failed>;

const TxObservable = (action$: ActionsObservable<ReduxAction>, params: { tx: ITransactionCall, success?: (tx: ITransaction[]) => Observable<ReduxAction>, failure?: (error: ITxError) => Observable<ReduxAction> }): Observable<ReduxAction> =>
    Observable.merge(
        action$.filter(l => isType(l, txExec.done) || isType(l, txExec.failed))
            .filter((l: TTxDoneAction) => {
                return params.tx.uuid === l.payload.params.uuid;
            })
            .take(1)
            .flatMap(result => {
                if (isType(result, txExec.done)) {
                    return params.success ? params.success(result.payload.result) : Observable.empty();
                }
                else if (isType(result, txExec.failed)) {
                    return params.failure ? params.failure(result.payload.error) : Observable.empty();
                }
                else {
                    return Observable.empty();
                }
            }),
        Observable.of(txCall(params.tx))
    );

export default TxObservable;