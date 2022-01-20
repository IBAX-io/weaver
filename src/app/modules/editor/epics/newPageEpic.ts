/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { Observable } from 'rxjs';
import { Epic } from 'modules';
import { editorSave, reloadEditorTab } from '../actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import TxObservable from 'modules/tx/util/TxObservable';

const newPageEpic: Epic = (action$, store, { api }) => action$.ofAction(editorSave)
    .filter(l => l.payload.new && 'page' === l.payload.type)
    .flatMap(action => {
        const state = store.getState();
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });
        const id = uuid.v4();

        return Observable.zip(
            Observable.from(client.getData({
                name: 'menu',
                columns: ['name']
            })),
            Observable.from(client.getData({
                name: 'applications',
                columns: ['id', 'deleted', 'name']
            }))
        ).flatMap(([menus, apps]) => ModalObservable<{ name: string, app: string, menu: string, conditions: string }>(action$, {
            modal: {
                id,
                type: 'CREATE_PAGE',
                params: {
                    menus: menus.list.map(l => l.name),
                    apps: apps.list.filter(l => '0' === l.deleted)
                }
            },
            success: result => TxObservable(action$, {
                tx: {
                    uuid: id,
                    contracts: [{
                        name: '@1NewPage',
                        params: [{
                            Name: result.name,
                            Value: action.payload.value,
                            Menu: result.menu,
                            Conditions: result.conditions,
                            ApplicationId: result.app || 0
                        }]
                    }]
                },
                success: tx => Observable.from(client.getPage({ name: result.name }))
                    .map(response => reloadEditorTab({
                        type: action.payload.type,
                        id: action.payload.id,
                        data: {
                            new: false,
                            id: String(response.id),
                            name: response.name,
                            initialValue: response.value
                        }
                    }))
            })
        }));
    });

export default newPageEpic;