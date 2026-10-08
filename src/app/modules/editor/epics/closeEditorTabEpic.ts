/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { closeEditorTab, destroyEditorTab } from '../actions';
import { modalShow } from 'modules/modal/actions';

const closeEditorTabEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(closeEditorTab),
    mergeMap(action => {
        const state = state$.value;
        const tab = state.editor.tabs.find(t => t.uuid === action.payload);

        if (!tab) {
            return EMPTY;
        }

        if (tab.dirty) {
            return of(modalShow({
                id: 'EDITOR_CLOSE',
                type: 'EDITOR_CLOSE_UNSAVED',
                params: {
                    uuid: tab.uuid
                }
            }));
        }

        return of(destroyEditorTab(tab.uuid));
    })
);

export default closeEditorTabEpic;
