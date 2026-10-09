/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { defer, EMPTY, iif, merge, of } from 'rxjs';
import { filter, mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { backupAccount } from '../actions';
import { modalShow } from 'modules/modal/actions';
import { txAuthorize } from 'modules/tx/actions';
import { isType } from 'typescript-fsa';

const backupAccountEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(backupAccount),
    // A module key never leaves the module: there is nothing to back up
    filter(() => !state$.value.auth.wallet?.wallet.module),
    mergeMap(action =>
        iif(
            () => 'software' === state$.value.auth.signingKey?.kind,
            defer(() => of(modalShow({
                id: 'BACKUP',
                type: 'BACKUP',
                params: {}
            }))),
            merge(
                of(txAuthorize.started({})),
                action$.pipe(
                    ofAction(txAuthorize.done, txAuthorize.failed),
                    take(1),
                    mergeMap(result => iif(
                        () => isType(result, txAuthorize.done),
                        defer(() => of(modalShow({
                            id: 'BACKUP',
                            type: 'BACKUP',
                            params: {}
                        }))),
                        EMPTY
                    ))
                )
            )
        )
    )
);

export default backupAccountEpic;
