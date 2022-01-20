/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { closeSecurityWarning } from '../actions';
import { Reducer } from 'modules';

const closeSecurityWarningHandler: Reducer<typeof closeSecurityWarning, State> = (state, payload) => ({
    ...state,
    securityWarningClosed: true
});

export default closeSecurityWarningHandler;