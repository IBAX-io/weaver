/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, iif, merge, of } from 'rxjs';
import { mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txCall, txAuthorize, txExec } from '../actions';
import { isType } from 'typescript-fsa';
import keyring from 'lib/keyring';

const txCallEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(txCall),
    // Ask for password if there is no privateKey
    mergeMap(action => iif(
        () => keyring.validatePrivateKey(state$.value.auth.privateKey),
        of(txExec.started(action.payload)),
        merge(
            of(txAuthorize.started({})),
            action$.pipe(
                ofAction(txAuthorize.done, txAuthorize.failed),
                take(1),
                mergeMap(result => iif(
                    () => isType(result, txAuthorize.done),
                    of(txExec.started(action.payload)),
                    EMPTY
                ))
            )
        )
    ))
);

export default txCallEpic;
