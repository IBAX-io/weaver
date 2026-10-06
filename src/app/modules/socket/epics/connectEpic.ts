/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable, Observer, of } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { connect, disconnect, setConnected } from '../actions';
import Centrifuge from 'centrifuge';

const connectEpic: Epic =
    action$ => action$.pipe(
        ofAction(connect.started),
        mergeMap(action => {
            if (action.payload.wsHost && action.payload.userID && action.payload.timestamp && action.payload.socketToken) {
                return new Observable((observer: Observer<Action>) => {
                    observer.next(disconnect.started(null));

                    const centrifuge = new Centrifuge(action.payload.wsHost + '/connection/websocket');
                    centrifuge.setToken(action.payload.socketToken);

                    centrifuge.on('connect', context => {
                        observer.next(connect.done({
                            params: action.payload,
                            result: {
                                session: action.payload.session,
                                instance: centrifuge
                            }
                        }));
                    });

                    centrifuge.on('disconnect', context => {
                        observer.next(setConnected(false));
                    });

                    centrifuge.on('error', error => {
                        observer.next(connect.failed({
                            params: action.payload,
                            error: error.message.error
                        }));
                    });

                    centrifuge.connect();

                    // Superseded by a newer connect: drop this client so its late events
                    // (e.g. disconnect) cannot flip the state of the new connection
                    return () => {
                        centrifuge.removeAllListeners();
                        centrifuge.disconnect();
                    };
                }).pipe(takeUntil(action$.pipe(ofAction(connect.started))));
            }
            else {
                return of(connect.failed({
                    params: action.payload,
                    error: null
                }));
            }

        })
    );

export default connectEpic;