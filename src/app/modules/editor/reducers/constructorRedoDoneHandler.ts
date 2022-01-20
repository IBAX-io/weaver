/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { constructorRedo } from '../actions';
import { Reducer } from 'modules';

const constructorRedoHandler: Reducer<typeof constructorRedo.done, State> = (state, payload) => ({
    ...state,
    tabs: [
        ...state.tabs.slice(0, state.tabIndex),
        {
            ...state.tabs[state.tabIndex],
            designer: {
                ...state.tabs[state.tabIndex].designer,
                data: {
                    ...state.tabs[state.tabIndex].designer.data,
                    jsonData: payload.result.jsonData,
                    treeData: payload.result.treeData,
                    selectedTag: null
                },
                history: {
                    ...state.tabs[state.tabIndex].designer.history,
                    position: payload.result.position,
                    canUndo: payload.result.canUndo,
                    canRedo: payload.result.canRedo
                }
            }
        },
        ...state.tabs.slice(state.tabIndex + 1),
    ]
});

export default constructorRedoHandler;