/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { setLocale } from '../actions';
import { Reducer } from 'modules';

const setLocaleDoneHandler: Reducer<typeof setLocale.done, State> = (state, payload) => ({
    ...state,
    locale: payload.result.locale,
    localeMessages: payload.result.values
});

export default setLocaleDoneHandler;