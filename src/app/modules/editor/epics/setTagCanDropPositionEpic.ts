/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const setTagCanDropPositionEpic: Epic<Action, IRootState> =
    (action$, store, { constructorModule }) => action$.ofAction(actions.setTagCanDropPosition.started)
        .map(action => {
            const state = store.getState().editor;
            const tab = state.tabs[state.tabIndex].designer;
            const tabData = tab && tab.data || null;
            let jsonData = tabData.jsonData && constructorModule.copyObject(tabData.jsonData) || null;

            let tag = constructorModule.findTagById(jsonData, action.payload.tagID).el;
            if (tag) {
                if (!tag.sysAttr) {
                    tag.sysAttr = {};
                }
                if ('string' === typeof action.payload.position) {
                    tag.sysAttr.canDropPosition = action.payload.position;
                }
            }

            return actions.setTagCanDropPosition.done({
                params: action.payload,
                result: {
                    jsonData,
                    treeData: constructorModule.convertToTreeData(jsonData)
                }
            });
        });

export default setTagCanDropPositionEpic;