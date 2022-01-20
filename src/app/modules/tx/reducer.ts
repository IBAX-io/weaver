/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as actions from './actions';
import { OrderedMap } from 'immutable';
import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { ITransactionCollection } from 'ibax/tx';
import txExecDoneHandler from './reducers/txExecDoneHandler';
import txExecHandler from './reducers/txExecHandler';
import txExecFailedHandler from './reducers/txExecFailedHandler';

export type State = {
    readonly transactions: OrderedMap<string, ITransactionCollection>;
};

export const initialState: State = {
    transactions: OrderedMap()
};

export default reducerWithInitialState(initialState)
    .case(actions.txExec.started, txExecHandler)
    .case(actions.txExec.done, txExecDoneHandler)
    .case(actions.txExec.failed, txExecFailedHandler);