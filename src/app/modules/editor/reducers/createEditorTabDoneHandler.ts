/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { createEditorTab } from '../actions';
import { Reducer } from 'modules';

const createEditorTabDoneHandler: Reducer<typeof createEditorTab.done, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs,
        {
            uuid: payload.result.uuid,
            type: payload.params,
            id: payload.result.id,
            new: true,
            name: payload.result.name,
            tool: 'editor',
            value: payload.result.value,
            initialValue: payload.result.value,
            dirty: false
        }
    ],
    tabIndex: state.tabs.length
});

export default createEditorTabDoneHandler;