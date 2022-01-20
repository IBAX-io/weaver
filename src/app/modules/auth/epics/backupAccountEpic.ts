/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { backupAccount } from '../actions';
import { modalShow } from 'modules/modal/actions';
import { Observable } from 'rxjs';
import { txAuthorize } from 'modules/tx/actions';
import { isType } from 'typescript-fsa';

const backupAccountEpic: Epic = (action$, store) => action$.ofAction(backupAccount)
    .flatMap(action =>
        Observable.if(
            () => !!store.getState().auth.privateKey,
            Observable.defer(() => Observable.of(modalShow({
                id: 'BACKUP',
                type: 'BACKUP',
                params: {}
            }))),
            Observable.merge(
                Observable.of(txAuthorize.started({})),
                action$.filter(l => txAuthorize.done.match(l) || txAuthorize.failed.match(l))
                    .take(1)
                    .flatMap(result => Observable.if(
                        () => isType(result, txAuthorize.done),
                        Observable.defer(() => Observable.of(modalShow({
                            id: 'BACKUP',
                            type: 'BACKUP',
                            params: {}
                        }))),
                        Observable.empty<never>()
                    ))
            )
        )
    );

export default backupAccountEpic;