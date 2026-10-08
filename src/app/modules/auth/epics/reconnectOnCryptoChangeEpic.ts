/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { discoverNetwork } from 'modules/engine/actions';
import { cryptoChanged } from '../actions';

// The network's algorithms changed: it is connected to again, so its accounts are listed (and
// signed in with) under the ones it reports now, not the ones it reported when last connected to
const reconnectOnCryptoChangeEpic: Epic = (action$, state$) => action$.pipe(
    ofAction(cryptoChanged),
    filter(action => state$.value.storage.networks.some(network => network.uuid === action.payload.network)),
    map(action => discoverNetwork.started({ uuid: action.payload.network }))
);

export default reconnectOnCryptoChangeEpic;
