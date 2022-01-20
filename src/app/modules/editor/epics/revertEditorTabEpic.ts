/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { resetEditorTab, revertEditorTab } from '../actions';
import { Observable } from 'rxjs';
import { modalShow } from 'modules/modal/actions';

const revertEditorTabEpic: Epic<Action, IRootState> = (action$, store) => action$.ofAction(revertEditorTab)
    .flatMap(action => {
        const state = store.getState();
        const tab = state.editor.tabs.find(t => t.uuid === action.payload);

        if (!tab) {
            return Observable.empty();
        }

        if (tab.dirty) {
            return Observable.of(modalShow({
                id: 'EDITOR_REVERT',
                type: 'EDITOR_REVERT_UNSAVED',
                params: {
                    uuid: tab.uuid
                }
            }));
        }

        return Observable.of(resetEditorTab(tab.uuid));
    });

export default revertEditorTabEpic;