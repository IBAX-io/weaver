/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { setTagCanDropPosition } from '../actions';
import { Reducer } from 'modules';

const setTagCanDropPositionDoneHandler: Reducer<typeof setTagCanDropPosition.done, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs.slice(0, state.tabIndex),
        {
            ...state.tabs[state.tabIndex],
            designer: {
                ...state.tabs[state.tabIndex].designer,
                data: {
                    ...state.tabs[state.tabIndex].designer.data,
                    jsonData: payload.result.jsonData,
                    treeData: payload.result.treeData
                }
            }
        },
        ...state.tabs.slice(state.tabIndex + 1),
    ]
});

export default setTagCanDropPositionDoneHandler;