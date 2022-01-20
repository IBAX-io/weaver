/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { Observable } from 'rxjs/Observable';
import { displayData } from 'modules/content/actions';
import { modalShow } from 'modules/modal/actions';
import urlJoin from 'url-join';

const displayDataEpic: Epic = (action$, store, { api }) => action$.ofAction(displayData.started)
    .flatMap(action => {
        const network = store.getState().engine.guestSession.network;

        return Observable.ajax({
            url: urlJoin(network.apiHost, 'api/v2', action.payload),
            responseType: 'text'

        }).flatMap(payload => Observable.of<Action>(
            modalShow({
                id: 'DISPLAY_INFO',
                type: 'INFO',
                params: {
                    value: payload.response
                }
            }),
            displayData.done({
                params: action.payload,
                result: payload.response
            })

        )).catch(e =>
            Observable.of(displayData.failed({
                params: action.payload,
                error: e
            }))
        );
    });

export default displayDataEpic;