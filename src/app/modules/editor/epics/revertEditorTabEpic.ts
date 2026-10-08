/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { resetEditorTab, revertEditorTab } from '../actions';
import { modalShow } from 'modules/modal/actions';

const revertEditorTabEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(revertEditorTab),
    mergeMap(action => {
        const state = state$.value;
        const tab = state.editor.tabs.find(t => t.uuid === action.payload);

        if (!tab) {
            return EMPTY;
        }

        if (tab.dirty) {
            return of(modalShow({
                id: 'EDITOR_REVERT',
                type: 'EDITOR_REVERT_UNSAVED',
                params: {
                    uuid: tab.uuid
                }
            }));
        }

        return of(resetEditorTab(tab.uuid));
    })
);

export default revertEditorTabEpic;
