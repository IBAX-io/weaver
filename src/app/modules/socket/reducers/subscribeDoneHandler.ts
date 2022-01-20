/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { subscribe } from '../actions';
import { Reducer } from 'modules';

const subscribeDoneHandler: Reducer<typeof subscribe.done, State> = (state, payload) => ({
    ...state,
    subscriptions: [
        ...state.subscriptions,
        {
            wallet: payload.params,
            instance: payload.result
        }
    ]
});

export default subscribeDoneHandler;