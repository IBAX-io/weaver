/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { Observable } from 'rxjs';
import { Epic } from 'modules';
import { editorSave, reloadEditorTab } from '../actions';
import TxObservable from 'modules/tx/util/TxObservable';
import ModalObservable from 'modules/modal/util/ModalObservable';

const newContractEpic: Epic = (action$, store, { api }) => action$.ofAction(editorSave)
    .filter(l => l.payload.new && 'contract' === l.payload.type)
    .flatMap(action => {
        const id = uuid.v4();
        const state = store.getState();
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });

        return Observable.from(client.getData({
            name: 'applications',
            columns: ['id', 'deleted', 'name']

        })).flatMap(apps => ModalObservable<{ app: string, conditions: string }>(action$, {
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
                success: results => Observable.from(results).flatMap(tx => Observable.fromPromise(client.getRow({
                    table: 'contracts',
                    id: tx.status.result

                })).map(response => reloadEditorTab({
                    type: action.payload.type,
                    id: action.payload.id,
                    data: {
                        new: false,
                        id: String(tx.status.result),
                        name: response.value.name,
                        initialValue: action.payload.value
                    }
                })))
            })
        }));
    });

export default newContractEpic;