/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import uuid from 'uuid';
import { Epic } from 'modules';
import { loadEditorTab } from '../actions';
import { Observable } from 'rxjs/Observable';

const loadEditorTabEpic: Epic = (action$, store, { api }) => action$.ofAction(loadEditorTab.started)
  .flatMap(action => {
    const state = store.getState();
    const client = api({
      apiHost: state.auth.session.network.apiHost,
      sessionToken: state.auth.session.sessionToken
    });
    const nameParser = /^(@[0-9]+)?(.*)$/i;

    return Observable.of(action.payload.type).flatMap(type => {
      switch (type) {
        case 'contract':
          return Observable.fromPromise(client.getContract({
            name: action.payload.name

          }).then(contract =>
            client.getRow({
              table: 'contracts',
              id: contract.tableid.toString()

            }).then(row => ({
              id: contract.tableid.toString(),
              name: nameParser.exec(contract.name)[2],
              contract: row.value
            }))

          )).map(data =>
            loadEditorTab.done({
              params: action.payload,
              result: {
                uuid: uuid.v4(),
                type: 'contract',
                id: data.id,
                new: false,
                name: data.contract.name,
                tool: 'editor',
                value: data.contract.value,
                initialValue: data.contract.value,
                dirty: false
              }
            })
          );

        case 'page':
          return Observable.from(client.getPage({
            name: action.payload.name

          })).map(data =>
            loadEditorTab.done({
              params: action.payload,
              result: {
                uuid: uuid.v4(),
                type: 'page',
                id: data.id.toString(),
                new: false,
                name: data.name,
                tool: 'editor',
                value: data.value,
                initialValue: data.value,
                dirty: false
              }
            })
          );

        case 'menu':
          return Observable.from(client.getMenu({
            name: action.payload.name

          })).map(data =>
            loadEditorTab.done({
              params: action.payload,
              result: {
                uuid: uuid.v4(),
                type: 'menu',
                id: data.id.toString(),
                new: false,
                name: data.name,
                tool: 'editor',
                value: data.value,
                initialValue: data.value,
                dirty: false
              }
            })
          );

        case 'block':
          return Observable.from(client.getBlock({
            name: action.payload.name

          })).map(data =>
            loadEditorTab.done({
              params: action.payload,
              result: {
                uuid: uuid.v4(),
                type: 'block',
                id: data.id.toString(),
                new: false,
                name: data.name,
                tool: 'editor',
                value: data.value,
                initialValue: data.value,
                dirty: false
              }
            })
          );

        default:
          throw { error: 'E_FAILED' };
      }

    }).catch(error => Observable.of(loadEditorTab.failed({
      params: action.payload,
      error
    })));
  });

export default loadEditorTabEpic;