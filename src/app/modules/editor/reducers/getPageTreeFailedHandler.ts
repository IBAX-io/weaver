/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { getPageTree } from '../actions';
import { Reducer } from 'modules';

const getPageTreeFailedHandler: Reducer<typeof getPageTree.failed, State> = (state, payload) => {
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
                        jsonData: [],
                        treeData: [],
                        selectedTag: null
                    }
                }
            },
            ...state.tabs.slice(state.tabIndex + 1),
        ]
    };
};

export default getPageTreeFailedHandler;