/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';
import { Observable } from 'rxjs';

const constructorUndoEpic: Epic<Action, IRootState> =
    (action$, store, { constructorModule }) => action$.ofAction(actions.constructorUndo.started)
        .flatMap(action => {
            const state = store.getState().editor;

            const tab = state.tabs[state.tabIndex].designer;
            const tabHistory = tab && tab.history || null;

            const historyData = tabHistory && tabHistory.data || [];

            let position = tabHistory && tabHistory.position || 0;

            if (position > 1 && historyData.length > 1) {
                position--;
                const canUndo = position > 1;
                const canRedo = true;

                let jsonData = historyData[position - 1];
                jsonData = constructorModule.updateChildrenText(jsonData);

                return Observable.of(actions.constructorUndo.done({
                    params: action.payload,
                    result: {
                        jsonData,
                        treeData: constructorModule.convertToTreeData(jsonData),
                        position,
                        canUndo,
                        canRedo
                    }
                }));
            }
            else {
                return Observable.empty();
            }
        });

export default constructorUndoEpic;