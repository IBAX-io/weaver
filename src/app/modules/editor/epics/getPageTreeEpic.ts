/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { getPageTree } from '../actions';
import { Observable } from 'rxjs/Observable';

const getPageTreeEpic: Epic = (action$, store, { constructorModule, api }) => action$.ofAction(getPageTree.started)
  .flatMap(action => {
    const state = store.getState();
    const client = api({
      apiHost: state.auth.session.network.apiHost,
      sessionToken: state.auth.session.sessionToken
    });

    const template = state.editor.tabs[state.editor.tabIndex].value;

    return Observable.fromPromise(client.contentJson({
      template,
      locale: state.storage.locale,
      source: true

    })).map(payload => {
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

    }).catch(e => Observable.of(getPageTree.failed({
      params: action.payload,
      error: e.error
    })));
  });

export default getPageTreeEpic;