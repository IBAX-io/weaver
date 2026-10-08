/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import * as actions from '../actions';

const getPageTreeDoneEpic: Epic =
  (action$, state$) => action$.pipe(
    ofAction(actions.getPageTree.done),
    map(action => {
      return actions.saveConstructorHistory.started(null);
    })
  );

export default getPageTreeDoneEpic;