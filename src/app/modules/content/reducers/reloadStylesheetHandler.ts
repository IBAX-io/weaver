/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { reloadStylesheet } from '../actions';
import { Reducer } from 'modules';

const reloadStylesheetHandler: Reducer<typeof reloadStylesheet, State> = (state, payload) => ({
    ...state,
    stylesheet: payload,
});

export default reloadStylesheetHandler;