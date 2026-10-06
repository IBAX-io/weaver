/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import * as actions from '../actions';
import { IRootState } from 'modules';

const getPageTreeDoneEpic: Epic =
  (action$, store) => action$.ofAction(actions.getPageTree.done)
    .map(action => {
      return actions.saveConstructorHistory.started(null);
    });

export default getPageTreeDoneEpic;