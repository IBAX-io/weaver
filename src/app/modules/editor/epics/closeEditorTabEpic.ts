/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { closeEditorTab, destroyEditorTab } from '../actions';
import { Observable } from 'rxjs';
import { modalShow } from 'modules/modal/actions';

const closeEditorTabEpic: Epic<Action, IRootState> = (action$, store) => action$.ofAction(closeEditorTab)
    .flatMap(action => {
        const state = store.getState();
        const tab = state.editor.tabs.find(t => t.uuid === action.payload);

        if (!tab) {
            return Observable.empty();
        }

        if (tab.dirty) {
            return Observable.of(modalShow({
                id: 'EDITOR_CLOSE',
                type: 'EDITOR_CLOSE_UNSAVED',
                params: {
                    uuid: tab.uuid
                }
            }));
        }

        return Observable.of(destroyEditorTab(tab.uuid));
    });

export default closeEditorTabEpic;