/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { isType } from 'typescript-fsa';
import { Observable } from 'rxjs/Observable';
import { modalClose } from '../actions';
import { logout } from 'modules/auth/actions';
import { locationChange } from 'modules/router/actions';

const closeModalOnInteractionEpic: Epic = (action$, store) => action$.filter(action => isType(action, locationChange) || isType(action, logout.started))
    .flatMap(() => {
        const state = store.getState();

        return Observable.if(
            () => state.modal.type && !state.modal.result,
            Observable.of(modalClose({
                reason: 'CANCEL',
                data: null
            })),
            Observable.empty<never>()
        );
    });

export default closeModalOnInteractionEpic;