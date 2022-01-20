/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const removeTagEpic: Epic<Action, IRootState> =
    (action$, store, { constructorModule }) => action$.ofAction(actions.removeTag.started)
        .map(action => {
            const state = store.getState().editor;
            const tab = state.tabs[state.tabIndex].designer;
            const tabData = tab && tab.data || null;
            let jsonData = tabData.jsonData && constructorModule.copyObject(tabData.jsonData) || null;

            // delete moved element
            let sourceTag = constructorModule.findTagById(jsonData, action.payload.tag.id);
            if (sourceTag.parent) {
                if (sourceTag.tail) {
                    sourceTag.parent.tail.splice(sourceTag.parentPosition, 1);
                }
                else {
                    sourceTag.parent.children.splice(sourceTag.parentPosition, 1);
                }
            }
            else {
                // root
                jsonData.splice(sourceTag.parentPosition, 1);
            }

            jsonData = constructorModule.updateChildrenText(jsonData);

            return actions.removeTag.done({
                params: action.payload,
                result: {
                    jsonData,
                    treeData: constructorModule.convertToTreeData(jsonData)
                }
            });
        });

export default removeTagEpic;