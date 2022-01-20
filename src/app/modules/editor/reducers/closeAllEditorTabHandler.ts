/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { closeEditorTab } from '../actions';
import { Reducer } from 'modules';

const closeEditorTabHandler: Reducer<typeof closeEditorTab, State> = (state, payload) => ({
    ...state,
    tabIndex: -1,
    tabs: []
});

export default closeEditorTabHandler;