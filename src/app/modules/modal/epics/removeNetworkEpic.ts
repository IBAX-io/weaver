/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { modalClose } from '../actions';
import { removeNetwork } from 'modules/storage/actions';

const removeNetworkEpic: Epic = action$ => action$.pipe(
    ofAction(modalClose),
    filter(l => 'RESULT' === l.payload.reason && 'REMOVE_NETWORK' === l.payload.id),
    map(action => removeNetwork(action.payload.data))
);

export default removeNetworkEpic;
