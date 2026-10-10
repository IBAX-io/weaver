/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable, Observer, of } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { INotificationsCount } from 'ibax/socket';
import { connect, disconnect, notificationsReceived, reconnected, setConnected } from '../actions';
import { Centrifuge } from 'centrifuge';

// Connects to Centrifugo with a session's token. The token subscribes the connection, on the
// server side, to the channel of the session's account: the client subscribes to nothing, and
// receives the account's notifications as the connection's own publications.
const connectEpic: Epic =
    action$ => action$.pipe(
        ofAction(connect.started),
        mergeMap(action => {
            if (!action.payload.url || !action.payload.token) {
                return of(connect.failed({
                    params: action.payload,
                    error: null
                }));
            }
            return new Observable((observer: Observer<Action>) => {
                observer.next(disconnect.started(null));

                const centrifuge = new Centrifuge(action.payload.url + '/connection/websocket', { token: action.payload.token });

                let connectedBefore = false;
                centrifuge.on('connected', () => {
                    observer.next(connect.done({
                        params: action.payload,
                        result: {
                            session: action.payload.session,
                            instance: centrifuge
                        }
                    }));
                    if (connectedBefore) {
                        observer.next(reconnected());
                    }
                    connectedBefore = true;
                });

                // Connecting again after the connection dropped, or given up (the token expired)
                centrifuge.on('connecting', () => {
                    observer.next(setConnected(false));
                });
                centrifuge.on('disconnected', () => {
                    observer.next(setConnected(false));
                });

                centrifuge.on('publication', context => {
                    observer.next(notificationsReceived(context.data as INotificationsCount[]));
                });

                centrifuge.connect();

                // Superseded by a newer connect: drop this client so its late events
                // (e.g. disconnect) cannot flip the state of the new connection
                return () => {
                    centrifuge.removeAllListeners();
                    centrifuge.disconnect();
                };
            }).pipe(takeUntil(action$.pipe(ofAction(connect.started))));
        })
    );

export default connectEpic;
