/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable } from 'rxjs/Observable';
import { Epic } from 'modules';
import { Observer } from 'rxjs';
import { subscribe, setNotificationsCount } from '../actions';
import { fetchNotifications } from 'modules/content/actions';
import findNotificationsCount from '../util/findNotificationsCount';
import platform from 'lib/platform';

const subscribeEpic: Epic = (action$, store) => action$.ofAction(subscribe.started)
    .flatMap(action => {
        const state = store.getState();
        if (state.socket.subscriptions.find(l => l.wallet.id === action.payload.id)) {
            return Observable.of(subscribe.failed({
                params: action.payload,
                error: 'E_ALREADY_SUBSCRIBED'
            }));
        }
        else if (!state.socket.socket) {
            return Observable.of(subscribe.failed({
                params: action.payload,
                error: 'E_SOCKET_OFFLINE'
            }));
        }
        else {
            return Observable.create((observer: Observer<Action>) => {
                const sub = state.socket.socket.subscribe('client' + action.payload.address, (message: { data: { role_id: string, ecosystem: string, count: number }[] }) => {
                    let count = 0;

                    message.data.forEach(n => {
                        const subState = store.getState();
                        const notifications = findNotificationsCount(subState.socket, subState.auth.wallet);

                        if (subState.auth.isAuthenticated &&
                            (
                                subState.auth.wallet.role && subState.auth.wallet.role.id === n.role_id ||
                                '0' === n.role_id
                            ) &&
                            subState.auth.wallet &&
                            subState.auth.wallet.wallet.id === action.payload.id &&
                            subState.auth.wallet.access.ecosystem === n.ecosystem.toString()
                        ) {
                            count += n.count;
                        }

                        observer.next(setNotificationsCount({
                            id: action.payload.id,
                            ecosystem: n.ecosystem,
                            role: n.role_id,
                            count: n.count
                        }));

                        const notificationsNew = findNotificationsCount(subState.socket, subState.auth.wallet);
                        if (notifications !== notificationsNew) {
                            observer.next(fetchNotifications.started(undefined));
                        }
                    });

                    platform.on('desktop', () => {
                        const Electron = require('electron');
                        Electron.remote.app.setBadgeCount(count);
                    });
                });

                observer.next(subscribe.done({
                    params: action.payload,
                    result: sub
                }));
            });
        }
    });

export default subscribeEpic;