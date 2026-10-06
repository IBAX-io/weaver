/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { EMPTY, merge, Observable, of } from 'rxjs';
import { filter, mergeMap, take } from 'rxjs/operators';
import { ofAction } from 'lib/rx/ofAction';
import { modalShow, modalClose } from '../actions';
import { IModalCall, TModalResultReason } from 'ibax/modal';

const ModalObservable = <T>(action$: Observable<Action>, params: { modal: IModalCall, success?: (data: T) => Observable<Action>, failure?: (reason: TModalResultReason) => Observable<Action> }): Observable<Action> =>
    merge(
        action$.pipe(
            ofAction(modalClose),
            filter(result => result.payload.id === params.modal.id),
            take(1),
            mergeMap((result): Observable<Action> => {
                if ('RESULT' === result.payload.reason) {
                    return params.success ? params.success(result.payload.data) : EMPTY;
                }
                else {
                    return params.failure ? params.failure(result.payload.reason) : EMPTY;
                }
            })
        ),
        of(modalShow(params.modal))
    );

export default ModalObservable;
