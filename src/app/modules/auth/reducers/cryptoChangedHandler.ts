/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { cryptoChanged } from '../actions';
import { Reducer } from 'modules';

// Kept through the sign-out (and stored, so a restart still says it), cleared by the next sign-in
const cryptoChangedHandler: Reducer<typeof cryptoChanged, State> = (state, payload) => ({
    ...state,
    signedOutBecause: payload
});

export default cryptoChangedHandler;
