/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { closeEditorTab } from '../actions';
import { Reducer } from 'modules';

const closeEditorTabHandler: Reducer<typeof closeEditorTab, State> = (state, payload) => ({
    ...state,
    tabIndex: state.tabs.filter(l => l.dirty).length >= 0 ? 0 : -1,
    tabs: [
        ...state.tabs.filter(l => l.dirty)
    ]
});

export default closeEditorTabHandler;