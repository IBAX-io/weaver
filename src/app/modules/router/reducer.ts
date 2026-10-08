/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { locationChange } from './actions';
import { IRouterState } from './types';

export type State = IRouterState;

export const initialState: State = {
    location: {
        pathname: '/',
        search: '',
        hash: '',
        state: null,
        key: 'default'
    },
    action: 'POP'
};

export default reducerWithInitialState<State>(initialState)
    .case(locationChange, (state, payload) => payload);
