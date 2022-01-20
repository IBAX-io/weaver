/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { unsubscribe } from '../actions';
import { Reducer } from 'modules';

const unsubscribeDoneHandler: Reducer<typeof unsubscribe.done, State> = (state, payload) => ({
    ...state,
    subscriptions: state.subscriptions.filter(l =>
        l.wallet.id !== payload.params.id
    )
});

export default unsubscribeDoneHandler;