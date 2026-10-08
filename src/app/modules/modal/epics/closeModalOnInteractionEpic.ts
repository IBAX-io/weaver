/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, iif, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { modalClose } from '../actions';
import { logout } from 'modules/auth/actions';
import { locationChange } from 'modules/router/actions';

const closeModalOnInteractionEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(locationChange, logout.started),
    mergeMap(() => {
        const state = state$.value;

        return iif(
            () => !!(state.modal.type && !state.modal.result),
            of(modalClose({
                id: state.modal.id,
                reason: 'CANCEL',
                data: null
            })),
            EMPTY
        );
    })
);

export default closeModalOnInteractionEpic;
