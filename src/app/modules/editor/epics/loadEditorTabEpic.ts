/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import uuid from 'uuid';
import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loadEditorTab } from '../actions';

const loadEditorTabEpic: Epic = (action$, state$, { api }) => action$.pipe(
  ofAction(loadEditorTab.started),
  mergeMap(action => {
    const state = state$.value;
    const client = api({
      apiHost: state.auth.session.network.apiHost,
      sessionToken: state.auth.session.sessionToken
    });
    const nameParser = /^(@[0-9]+)?(.*)$/i;

    return of(action.payload.type).pipe(
      mergeMap(type => {
        switch (type) {
          case 'contract':
            return from(client.getContract({
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

            )).pipe(
              map(data =>
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
              )
            );

          case 'page':
            return from(client.getPage({
              name: action.payload.name

            })).pipe(
              map(data =>
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
              )
            );

          case 'menu':
            return from(client.getMenu({
              name: action.payload.name

            })).pipe(
              map(data =>
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
              )
            );

          case 'block':
            return from(client.getBlock({
              name: action.payload.name

            })).pipe(
              map(data =>
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
              )
            );

          default:
            throw { error: 'E_FAILED' };
        }
      }),
      catchError(error => of(loadEditorTab.failed({
        params: action.payload,
        error
      })))
    );
  })
);

export default loadEditorTabEpic;
