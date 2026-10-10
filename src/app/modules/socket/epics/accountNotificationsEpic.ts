/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, merge } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { loadWallet, loadWallets } from 'modules/auth/actions';
import { loadNotifications } from '../actions';

// The counts of the keyring's accounts, as the node lists them with the accounts
const accountNotificationsEpic: Epic = action$ => merge(
    action$.pipe(ofAction(loadWallets.done), mergeMap(action => from(action.payload.result))),
    action$.pipe(ofAction(loadWallet), map(action => action.payload))
).pipe(
    filter(account => !!account.address),
    map(account => loadNotifications(account))
);

export default accountNotificationsEpic;
