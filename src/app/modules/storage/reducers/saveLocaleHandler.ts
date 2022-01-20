/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { saveLocale } from '../actions';
import { Reducer } from 'modules';

const saveLocaleHandler: Reducer<typeof saveLocale, State> = (state, payload) => ({
    ...state,
    locale: payload
});

export default saveLocaleHandler;