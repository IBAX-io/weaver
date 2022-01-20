/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { changeEditorTab } from '../actions';
import { Reducer } from 'modules';

const changeEditorTabHandler: Reducer<typeof changeEditorTab, State> = (state, payload) => {
    const tabIndex = state.tabs.findIndex(t => t.uuid === payload);

    if (-1 === tabIndex) {
        return state;
    }

    return {
        ...state,
        tabIndex
    };
};

export default changeEditorTabHandler;