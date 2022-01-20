/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const selectTagEpic: Epic<Action, IRootState> =
    (action$, store, { constructorModule }) => action$.ofAction(actions.selectTag.started)
        .map(action => {
            const state = store.getState().editor;
            const tabData = state.tabs[state.tabIndex].designer.data;
            const jsonData = tabData && constructorModule.copyObject(tabData.jsonData) || null;

            const selectedTag = action.payload;

            return actions.selectTag.done({
                params: action.payload,
                result: {
                    treeData: constructorModule.convertToTreeData(jsonData, selectedTag),
                    selectedTag
                }
            });

        });

export default selectTagEpic;