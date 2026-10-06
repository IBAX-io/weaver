/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import * as actions from '../actions';
import { modalShow } from 'modules/modal/actions';

const debugContractEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(actions.debugContract),
    mergeMap(action => {
        const state = state$.value;
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });
        return from(client.getContract({ name: action.payload })).pipe(
            map(contract => modalShow({
                id: 'DEBUG_CONTRACT',
                type: 'DEBUG_CONTRACT',
                params: {
                    contract: action.payload,
                    fields: contract.fields
                }
            }))
        );
    })
);

export default debugContractEpic;
