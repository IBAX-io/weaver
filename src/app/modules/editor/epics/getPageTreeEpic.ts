/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { getPageTree } from '../actions';
import { signedInSession } from 'modules/auth/selectors';
import { E_SIGNED_OUT } from 'modules/auth/actions';

const getPageTreeEpic: Epic = (action$, state$, { constructorModule, api }) => action$.pipe(
  ofAction(getPageTree.started),
  mergeMap(action => {
    const state = state$.value;
    const session = signedInSession(state);
    // Signed out of since it was asked for: the node is not asked
    if (!session) {
        return of(getPageTree.failed({ params: action.payload, error: E_SIGNED_OUT }));
    }
    const client = api({
        apiHost: session.network.apiHost,
        sessionToken: session.sessionToken
    });

    const template = state.editor.tabs[state.editor.tabIndex].value;

    return from(client.contentJson({
      template,
      locale: state.storage.locale,
      source: true

    })).pipe(
      map(payload => {
        let jsonData = payload.tree;
        constructorModule.setIds(jsonData);

        jsonData = constructorModule.updateChildrenText(jsonData);

        return getPageTree.done({
          params: action.payload,
          result: {
            jsonData,
            treeData: constructorModule.convertToTreeData(jsonData)
          }
        });

      }),
      catchError(e => of(getPageTree.failed({
        params: action.payload,
        error: e.error
      })))
    );
  })
);

export default getPageTreeEpic;
