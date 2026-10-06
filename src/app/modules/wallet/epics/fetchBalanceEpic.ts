/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { forkJoin, from, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { apiErrorCode, InvalidResponseError } from 'lib/ibaxAPI/errors';
import { isBalanceUnits } from 'lib/tx/amount';
import { IBalanceResponse } from 'ibax/api';
import { logout } from 'modules/auth/actions';
import { FEE_ECOSYSTEM, fetchBalance } from '../actions';

// The page does arithmetic on these: anything else from the node is refused, not shown
const isBalanceResponse = (value: unknown): value is IBalanceResponse => {
    const balance = value as IBalanceResponse;
    return !!balance && 'object' === typeof balance
        && isBalanceUnits(String(balance.amount)) && isBalanceUnits(String(balance.utxo)) && isBalanceUnits(String(balance.total))
        && Number.isInteger(balance.digits) && balance.digits >= 0 && balance.digits <= 30
        && 'string' === typeof balance.token_symbol;
};

const fetchBalanceEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(fetchBalance.started),
    switchMap(action => {
        const client = api({ apiHost: state$.value.auth.session.network.apiHost });
        const request = (ecosystem: string) => from(client.getBalance({ wallet: action.payload.account, ecosystem })).pipe(
            map(response => {
                if (!isBalanceResponse(response)) {
                    throw new InvalidResponseError('balance');
                }
                return { ...response, amount: String(response.amount), utxo: String(response.utxo), total: String(response.total) };
            })
        );
        const ecosystem = action.payload.ecosystem;
        return forkJoin([request(ecosystem), FEE_ECOSYSTEM === ecosystem ? of(null) : request(FEE_ECOSYSTEM)]).pipe(
            map(([value, fee]) => fetchBalance.done({
                params: action.payload,
                result: { value, fee: fee || value }
            })),
            catchError(e => of(fetchBalance.failed({
                params: action.payload,
                error: apiErrorCode(e)
            }))),
            takeUntil(action$.pipe(ofAction(logout.started)))
        );
    })
);

export default fetchBalanceEpic;
