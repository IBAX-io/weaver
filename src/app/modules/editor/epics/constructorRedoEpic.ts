/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import * as actions from '../actions';

const constructorRedoEpic: Epic =
    (action$, state$, { constructorModule }) => action$.pipe(
        ofAction(actions.constructorRedo.started),
        mergeMap(action => {
            const state = state$.value.editor;

            const tab = state.tabs[state.tabIndex].designer;
            const tabHistory = tab && tab.history || null;

            const historyData = tabHistory && tabHistory.data || [];

            let position = tabHistory && tabHistory.position || 0;

            if (position < historyData.length && historyData.length > 0) {
                position++;
                const canUndo = position > 1;
                const canRedo = position < historyData.length;

                let jsonData = historyData[position - 1];
                jsonData = constructorModule.updateChildrenText(jsonData);

                return of(actions.constructorRedo.done({
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
                return EMPTY;
            }
        })
    );

export default constructorRedoEpic;