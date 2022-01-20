/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { loadEditorTab } from '../actions';
import { Reducer } from 'modules';
import findTabIndex from './findTabIndex';

const loadEditorTabDoneHandler: Reducer<typeof loadEditorTab.done, State> = (state, payload) => {
    const tabIndex = findTabIndex(state, payload.result);

    const tabs = -1 === tabIndex ?
        [
            ...state.tabs,
            {
                ...payload.result
            }
        ] : [
            ...state.tabs.slice(0, tabIndex),
            {
                ...state.tabs[tabIndex],
                initialValue: payload.result.initialValue,
                dirty: payload.result.initialValue !== state.tabs[tabIndex].value
            },
            ...state.tabs.slice(tabIndex + 1)
        ];

    return {
        ...state,
        tabIndex: -1 === tabIndex ? tabs.length - 1 : tabIndex,
        tabs
    };
};

export default loadEditorTabDoneHandler;