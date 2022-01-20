/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { sectionsInit } from '../actions';
import { Reducer } from 'modules';

const sectionsInitHandler: Reducer<typeof sectionsInit, State> = (state, payload): State => ({
    ...state,
    mainSection: payload.mainSection,
    sections: payload.sections
});

export default sectionsInitHandler;