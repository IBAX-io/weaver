/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable } from 'rxjs';
import { ActionsObservable } from 'redux-observable';
import { modalShow, modalClose } from '../actions';
import { IModalCall, TModalResultReason } from 'ibax/modal';

const ModalObservable = <T>(action$: ActionsObservable<Action>, params: { modal: IModalCall, success?: (data: T) => Observable<Action>, failure?: (reason: TModalResultReason) => Observable<Action> }) =>
    Observable.merge(
        action$.ofAction(modalClose)
            .take(1)
            .flatMap(result => {
                if ('RESULT' === result.payload.reason) {
                    return params.success ? params.success(result.payload.data) : Observable.empty<never>();
                }
                else {
                    return params.failure ? params.failure(result.payload.reason) : Observable.empty<never>();
                }
            }),
        Observable.of(modalShow(params.modal))
    );

export default ModalObservable;