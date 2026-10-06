/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import * as actions from '../actions';

const setTagCanDropPositionEpic: Epic =
    (action$, state$, { constructorModule }) => action$.pipe(
        ofAction(actions.setTagCanDropPosition.started),
        map(action => {
            const state = state$.value.editor;
            const tab = state.tabs[state.tabIndex].designer;
            const tabData = tab && tab.data || null;
            let jsonData = tabData.jsonData && constructorModule.copyObject(tabData.jsonData) || null;

            let tag: any = constructorModule.findTagById(jsonData, action.payload.tagID).el;
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
        })
    );

export default setTagCanDropPositionEpic;