/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import * as actions from '../actions';
import { modalShow } from 'modules/modal/actions';
import { Observable } from 'rxjs';

const debugContractEpic: Epic = (action$, store, { api }) => action$.ofAction(actions.debugContract)
    .flatMap(action => {
        const state = store.getState();
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });
        return Observable.from(client.getContract({ name: action.payload }))
            .map(contract => modalShow({
                id: 'DEBUG_CONTRACT',
                type: 'DEBUG_CONTRACT',
                params: {
                    contract: action.payload,
                    fields: contract.fields
                }
            }));
    });

export default debugContractEpic;