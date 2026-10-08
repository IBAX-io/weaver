/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { filter, map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { txExec } from '../actions';
import { modalShow } from '../../modal/actions';
import { navigate } from 'modules/router/actions';

export const txExecFailedEpic: Epic = (action$, state$, { routerService }) => action$.pipe(
    ofAction(txExec.failed),
    // Nothing to show for a cancelled prompt; a change of the network's key algorithms is said on
    // the sign-in page the user is sent to
    filter(l => !l.payload.params.silent && 'E_AUTH_CANCELLED' !== l.payload.error.type && 'E_CRYPTO_CHANGED' !== l.payload.error.type),
    map(action => {
        if (action.payload.params.section && action.payload.error.id && action.payload.params.errorRedirects) {
            const errorRedirect = action.payload.params.errorRedirects[action.payload.error.id];
            if (errorRedirect) {
                const route = routerService.routeToBrowser(action.payload.params.section, errorRedirect.pagename, errorRedirect.pageparams);
                return navigate({ to: route });
            }
        }

        return modalShow({
            id: 'TX_ERROR',
            type: 'TX_ERROR',
            params: action.payload.error
        });
    })
);

export default txExecFailedEpic;
