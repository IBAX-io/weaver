/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { discoverNetwork } from '../actions';
import { modalShow } from 'modules/modal/actions';

const discoverNetworkFailedEpic: Epic = action$ => action$.pipe(
    ofAction(discoverNetwork.failed),
    map(action => modalShow({
        id: 'NETWORK_ERROR',
        params: {
            error: action.payload.error
        },
        type: 'NETWORK_ERROR'
    }))
);

export default discoverNetworkFailedEpic;
