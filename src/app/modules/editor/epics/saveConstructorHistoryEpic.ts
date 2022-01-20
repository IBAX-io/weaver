/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const saveConstructorHistoryEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(actions.saveConstructorHistory.started)
        .map(action => {
            const state = store.getState().editor;
            const tab = state.tabs[state.tabIndex].designer;
            const tabData = tab && tab.data || null;
            const tabHistory = tab && tab.history || null;

            let historyData = tabHistory && tabHistory.data || [];
            const jsonData = tabData && tabData.jsonData || [];

            const position = tabHistory && tabHistory.position || 0;

            if (position < historyData.length) {
                historyData = [...historyData.slice(0, position)];
            }

            const canUndo = position > 0;
            const canRedo = false;

            return actions.saveConstructorHistory.done({
                params: action.payload,
                result: {
                    data: historyData.concat([jsonData]),
                    position: position + 1,
                    canUndo,
                    canRedo
                }
            });
        });

export default saveConstructorHistoryEpic;