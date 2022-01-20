/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { changeEditorTool } from '../actions';
import { Reducer } from 'modules';

const changeEditorToolStartedHandler: Reducer<typeof changeEditorTool.started, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs.slice(0, state.tabIndex),
        {
            ...state.tabs[state.tabIndex],
            tool: payload,
            preview: null
        },
        ...state.tabs.slice(state.tabIndex + 1),
    ]
});

export default changeEditorToolStartedHandler;