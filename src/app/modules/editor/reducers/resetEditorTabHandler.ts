/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { resetEditorTab } from '../actions';
import { Reducer } from 'modules';

const resetEditorTabHandler: Reducer<typeof resetEditorTab, State> = (state, payload) => {
    const tabIndex = state.tabs.findIndex(t => t.uuid === payload);

    if (-1 === tabIndex) {
        return state;
    }

    return {
        ...state,
        tabs: [
            ...state.tabs.slice(0, tabIndex),
            {
                ...state.tabs[tabIndex],
                value: state.tabs[tabIndex].initialValue,
                dirty: false
            },
            ...state.tabs.slice(tabIndex + 1),
        ]
    };
};

export default resetEditorTabHandler;