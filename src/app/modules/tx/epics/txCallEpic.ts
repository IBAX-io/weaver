/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { Observable } from 'rxjs';
import { txCall, txAuthorize, txExec } from '../actions';
import { isType } from 'typescript-fsa';
import keyring from 'lib/keyring';

const txCallEpic: Epic = (action$, store) => action$.ofAction(txCall)
    // Ask for password if there is no privateKey
    .flatMap(action => Observable.if(
        () => keyring.validatePrivateKey(store.getState().auth.privateKey),
        Observable.of(txExec.started(action.payload)),
        Observable.merge(
            Observable.of(txAuthorize.started({})),
            action$.filter(l => txAuthorize.done.match(l) || txAuthorize.failed.match(l))
                .take(1)
                .flatMap(result => Observable.if(
                    () => isType(result, txAuthorize.done),
                    Observable.of(txExec.started(action.payload)),
                    Observable.empty<never>()
                ))
        )
    ));

export default txCallEpic;