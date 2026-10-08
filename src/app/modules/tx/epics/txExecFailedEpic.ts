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

// Nothing to show for a cancelled prompt or for transactions of a session signed out of since; a
// session the app ended (the network's key algorithms changed, or the node refused its token) is
// explained on the sign-in page the user is sent to
const SILENT_ERRORS = ['E_AUTH_CANCELLED', 'E_SIGNED_OUT', 'E_CRYPTO_CHANGED', 'E_TOKENEXPIRED'];

export const txExecFailedEpic: Epic = (action$, state$, { routerService }) => action$.pipe(
    ofAction(txExec.failed),
    filter(l => !l.payload.params.silent && !SILENT_ERRORS.includes(l.payload.error.type)),
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
