
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import reducer, { State } from './reducer';
import epic from './epic';
import * as actions from './actions';

export type State = State;
export {
  actions,
  reducer,
  epic
};