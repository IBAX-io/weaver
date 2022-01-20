
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { loadWallet } from '../actions';
import { Observable } from 'rxjs';
import { saveWallet } from 'modules/storage/actions';

const loadSavedWalletEpic: Epic = (action$, store, { api }) => action$.ofAction(saveWallet)
    .flatMap(action => {
        const network = store.getState().engine.guestSession.network;
        const client = api({ apiHost: network.apiHost });

        return Observable.from(client.keyinfo({
            id: action.payload.id

        })).map(account => loadWallet({
            id: action.payload.id,
            address: account.account,
            encKey: action.payload.encKey,
            publicKey: action.payload.publicKey,
            access: account.ecosystems.map(key => ({
                ...key,
                roles: key.roles || []
            }))

        })).catch(e => Observable.empty<never>());
    });

export default loadSavedWalletEpic;