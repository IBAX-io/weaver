/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { saveConstructorHistory } from '../actions';
import { Reducer } from 'modules';

const saveConstructorHistoryDoneHandler: Reducer<typeof saveConstructorHistory.done, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs.slice(0, state.tabIndex),
        {
            ...state.tabs[state.tabIndex],
            designer: {
                ...state.tabs[state.tabIndex].designer,
                history: {
                    data: payload.result.data,
                    position: payload.result.position,
                    canUndo: payload.result.canUndo,
                    canRedo: payload.result.canRedo
                }
            }
        },
        ...state.tabs.slice(state.tabIndex + 1),
    ]
});

export default saveConstructorHistoryDoneHandler;