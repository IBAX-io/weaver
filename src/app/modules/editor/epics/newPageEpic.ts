/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { from, zip, EMPTY } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { editorSave, reloadEditorTab } from '../actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import TxObservable from 'modules/tx/util/TxObservable';
import { signedInSession } from 'modules/auth/selectors';

const newPageEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(editorSave),
    filter(l => l.payload.new && 'page' === l.payload.type),
    mergeMap(action => {
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
        const id = uuid.v4();

        return zip(
            from(client.getData({
                name: 'menu',
                columns: ['name']
            })),
            from(client.getData({
                name: 'applications',
                columns: ['id', 'deleted', 'name']
            }))
        ).pipe(
            mergeMap(([menus, apps]) => ModalObservable<{ name: string, app: string, menu: string, conditions: string }>(action$, {
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
                    success: tx => from(client.getPage({ name: result.name })).pipe(
                        map(response => reloadEditorTab({
                            type: action.payload.type,
                            id: action.payload.id,
                            data: {
                                new: false,
                                id: String(response.id),
                                name: response.name,
                                initialValue: response.value
                            }
                        }))
                    )
                })
            }))
        );
    })
);

export default newPageEpic;
