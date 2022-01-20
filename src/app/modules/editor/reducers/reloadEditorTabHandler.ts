/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { reloadEditorTab } from '../actions';
import { Reducer } from 'modules';
import findTabIndex from './findTabIndex';

const reloadEditorTabHandler: Reducer<typeof reloadEditorTab, State> = (state, payload) => {
    const index = findTabIndex(state, payload);
    const value = state.tabs[index];

    if (-1 === index) {
        return state;
    }
    else {
        return {
            ...state,
            tabs: [
                ...state.tabs.slice(0, index),
                {
                    ...value,
                    ...payload.data,
                    dirty: 'boolean' === typeof payload.data.dirty ?
                        payload.data.dirty :
                        (value.value !== (payload.data.initialValue || value.initialValue))
                },
                ...state.tabs.slice(index + 1)
            ]
        };
    }
};

export default reloadEditorTabHandler;