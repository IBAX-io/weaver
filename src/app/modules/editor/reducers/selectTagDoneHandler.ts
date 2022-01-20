/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { selectTag } from '../actions';
import { Reducer } from 'modules';

const selectTagDoneHandler: Reducer<typeof selectTag.done, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs.slice(0, state.tabIndex),
        {
            ...state.tabs[state.tabIndex],
            designer: {
                ...state.tabs[state.tabIndex].designer,
                data: {
                    ...state.tabs[state.tabIndex].designer.data,
                    treeData: payload.result.treeData,
                    selectedTag: payload.result.selectedTag
                }
            }

        },
        ...state.tabs.slice(state.tabIndex + 1),
    ]
});

export default selectTagDoneHandler;