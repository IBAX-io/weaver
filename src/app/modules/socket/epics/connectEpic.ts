/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Observable } from 'rxjs/Observable';
import { Epic } from 'redux-observable';
import { IRootState } from 'modules';
import { connect, disconnect, setConnected } from '../actions';
import Centrifuge from 'centrifuge';
import { Observer } from 'rxjs';

const connectEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(connect.started)
        .flatMap(action => {
            if (action.payload.wsHost && action.payload.userID && action.payload.timestamp && action.payload.socketToken) {
                return Observable.create((observer: Observer<Action>) => {
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

                }).takeUntil(action$.ofAction(connect.started));
            }
            else {
                return Observable.of(connect.failed({
                    params: action.payload,
                    error: null
                }));
            }

        });

export default connectEpic;