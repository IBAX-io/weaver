/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { getPageTree } from '../actions';
import { Reducer } from 'modules';

const getPageTreeDoneHandler: Reducer<typeof getPageTree.done, State> = (state, payload) => {
    const data = state.tabs[state.tabIndex] && state.tabs[state.tabIndex].designer && state.tabs[state.tabIndex].designer.data;
    return {
        ...state,
        tabs: [
            ...state.tabs.slice(0, state.tabIndex),
            {
                ...state.tabs[state.tabIndex],
                designer: {
                    ...state.tabs[state.tabIndex].designer,
                    data: {
                        ...data,
                        jsonData: payload.result.jsonData,
                        treeData: payload.result.treeData,
                        selectedTag: null
                    }
                }
            },
            ...state.tabs.slice(state.tabIndex + 1),
        ]
    };
};

export default getPageTreeDoneHandler;