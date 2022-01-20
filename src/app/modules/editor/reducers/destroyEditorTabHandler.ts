/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { destroyEditorTab } from '../actions';
import { Reducer } from 'modules';

const destroyEditorTabHandler: Reducer<typeof destroyEditorTab, State> = (state, payload) => {
    const tabIndex = state.tabs.findIndex(t => t.uuid === payload);

    if (-1 === tabIndex) {
        return state;
    }

    return {
        ...state,
        tabIndex: state.tabIndex >= state.tabs.length - 1 ? state.tabs.length - 2 : state.tabIndex,
        tabs: [
            ...state.tabs.slice(0, tabIndex),
            ...state.tabs.slice(tabIndex + 1),
        ]
    };
};

export default destroyEditorTabHandler;