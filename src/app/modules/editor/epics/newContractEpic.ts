/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { from, EMPTY } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { editorSave, reloadEditorTab } from '../actions';
import TxObservable from 'modules/tx/util/TxObservable';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { signedInSession } from 'modules/auth/selectors';

const newContractEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(editorSave),
    filter(l => l.payload.new && 'contract' === l.payload.type),
    mergeMap(action => {
        const id = uuid.v4();
        const state = state$.value;
        const session = signedInSession(state);
        // Signed out of since it was asked for: the node is not asked
        if (!session) {
            return EMPTY;
        }
        const client = api({
            apiHost: session.network.apiHost,
            sessionToken: session.sessionToken
        });

        return from(client.getData({
            name: 'applications',
            columns: ['id', 'deleted', 'name']

        })).pipe(
            mergeMap(apps => ModalObservable<{ app: string, conditions: string }>(action$, {
                modal: {
                    id,
                    type: 'CREATE_CONTRACT',
                    params: {
                        apps: apps.list.filter(l => '0' === l.deleted)
                    }
                },
                success: result => TxObservable(action$, {
                    tx: {
                        uuid: id,
                        contracts: [{
                            name: '@1NewContract',
                            params: [{
                                Value: action.payload.value,
                                Conditions: result.conditions,
                                ApplicationId: result.app || 0
                            }]
                        }]
                    },
                    success: results => from(results).pipe(
                        mergeMap(tx => from(client.getRow({
                            table: 'contracts',
                            id: tx.status.result

                        })).pipe(
                            map(response => reloadEditorTab({
                                type: action.payload.type,
                                id: action.payload.id,
                                data: {
                                    new: false,
                                    id: String(tx.status.result),
                                    name: response.value.name,
                                    initialValue: action.payload.value
                                }
                            }))
                        ))
                    )
                })
            }))
        );
    })
);

export default newContractEpic;
