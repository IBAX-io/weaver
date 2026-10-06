/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { isType } from 'typescript-fsa';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { modalClose, modalShow } from '../actions';

// Only one modal is on screen: showing another one closes the open modal with OVERLAP, so
// whoever waits for its result is told instead of waiting forever
const modalOverlapEpic: Epic = action$ => {
    let openID: string | null = null;
    return action$.pipe(
        ofAction(modalShow, modalClose),
        mergeMap((action): Observable<Action> => {
            if (isType(action, modalClose)) {
                if (action.payload.id === openID) {
                    openID = null;
                }
                return EMPTY;
            }
            const previous = openID;
            openID = action.payload.id;
            return previous && previous !== action.payload.id
                ? of(modalClose({ id: previous, reason: 'OVERLAP', data: null }))
                : EMPTY;
        })
    );
};

export default modalOverlapEpic;
