/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import * as actions from '../actions';

const selectTagEpic: Epic =
    (action$, state$, { constructorModule }) => action$.pipe(
        ofAction(actions.selectTag.started),
        map(action => {
            const state = state$.value.editor;
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

        })
    );

export default selectTagEpic;