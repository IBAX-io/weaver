/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { getPageTree } from '../actions';

const getPageTreeEpic: Epic = (action$, state$, { constructorModule, api }) => action$.pipe(
  ofAction(getPageTree.started),
  mergeMap(action => {
    const state = state$.value;
    const client = api({
      apiHost: state.auth.session.network.apiHost,
      sessionToken: state.auth.session.sessionToken
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
