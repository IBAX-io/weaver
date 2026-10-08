/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action as ReduxAction } from 'redux';
import { EMPTY, merge, Observable, of } from 'rxjs';
import { filter, mergeMap, take } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { txCall, txExec } from '../actions';
import { ITransactionCall, ITxError, ITransaction } from 'ibax/tx';
import { isType } from 'typescript-fsa';

const TxObservable = (action$: Observable<ReduxAction>, params: { tx: ITransactionCall, success?: (tx: ITransaction[]) => Observable<ReduxAction>, failure?: (error: ITxError) => Observable<ReduxAction> }): Observable<ReduxAction> =>
    merge(
        action$.pipe(
            ofAction(txExec.done, txExec.failed),
            filter(l => {
                return params.tx.uuid === l.payload.params.uuid;
            }),
            take(1),
            mergeMap((result): Observable<ReduxAction> => {
                if (isType(result, txExec.done)) {
                    return params.success ? params.success(result.payload.result) : EMPTY;
                }
                else if (isType(result, txExec.failed)) {
                    return params.failure ? params.failure(result.payload.error) : EMPTY;
                }
                else {
                    return EMPTY;
                }
            })
        ),
        of(txCall(params.tx))
    );

export default TxObservable;
