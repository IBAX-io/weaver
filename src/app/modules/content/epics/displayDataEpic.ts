/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { of } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { catchError, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { displayData } from 'modules/content/actions';
import { modalShow } from 'modules/modal/actions';
import urlJoin from 'url-join';

const displayDataEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(displayData.started),
    mergeMap(action => {
        const network = state$.value.engine.guestSession.network;

        return ajax<string>({
            url: urlJoin(network.apiHost, 'api/v2', action.payload),
            responseType: 'text'

        }).pipe(
            mergeMap(payload => of(
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
            )),
            catchError(e =>
                of(displayData.failed({
                    params: action.payload,
                    error: e
                }))
            )
        );
    })
);

export default displayDataEpic;
