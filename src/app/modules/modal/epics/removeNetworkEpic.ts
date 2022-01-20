/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { modalClose } from '../actions';
import { removeNetwork } from 'modules/storage/actions';

const removeNetworkEpic: Epic = (action$, store, { api }) => action$.ofAction(modalClose)
    .filter(l => 'RESULT' === l.payload.reason && 'REMOVE_NETWORK' === store.getState().modal.id)
    .map(action => removeNetwork(action.payload.data));

export default removeNetworkEpic;