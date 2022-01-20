/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { updateEditorTab } from '../actions';
import { Reducer } from 'modules';

const updateEditorTabHandler: Reducer<typeof updateEditorTab, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs.slice(0, state.tabIndex),
        {
            ...state.tabs[state.tabIndex],
            value: payload,
            dirty: state.tabs[state.tabIndex].initialValue !== payload
        },
        ...state.tabs.slice(state.tabIndex + 1),
    ]
});

export default updateEditorTabHandler;