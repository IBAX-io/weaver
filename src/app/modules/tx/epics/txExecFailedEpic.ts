/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { txExec } from '../actions';
import { modalShow } from '../../modal/actions';
import { push } from 'connected-react-router';

export const txExecFailedEpic: Epic = (action$, store, { routerService }) => action$.ofAction(txExec.failed)
    .filter(l => !l.payload.params.silent)
    .map(action => {
        if (action.payload.params.section && action.payload.error.id && action.payload.params.errorRedirects) {
            const errorRedirect = action.payload.params.errorRedirects[action.payload.error.id];
            if (errorRedirect) {
                const route = routerService.routeToBrowser(action.payload.params.section, errorRedirect.pagename, errorRedirect.pageparams);
                return push(route);
            }
        }

        return modalShow({
            id: 'TX_ERROR',
            type: 'TX_ERROR',
            params: action.payload.error
        });
    });

export default txExecFailedEpic;