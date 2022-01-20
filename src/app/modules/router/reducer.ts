/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { RouterState } from 'connected-react-router';

export type State =
    RouterState;

export const initialState: RouterState = {
    location: {
        key: '',
        pathname: '',
        search: '',
        hash: ''
    },
    action: 'PUSH'
};

export default reducerWithInitialState<State>(initialState);