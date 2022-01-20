/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'redux-observable';
import * as actions from '../actions';
import { IRootState } from 'modules';

const getPageTreeDoneEpic: Epic<Action, IRootState> =
  (action$, store) => action$.ofAction(actions.getPageTree.done)
    .map(action => {
      return actions.saveConstructorHistory.started(null);
    });

export default getPageTreeDoneEpic;