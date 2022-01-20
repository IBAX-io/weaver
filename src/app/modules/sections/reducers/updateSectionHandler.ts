/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { updateSection } from '../actions';
import { Reducer } from 'modules';

const updateSectionHandler: Reducer<typeof updateSection, State> = (state, payload): State => ({
    ...state,
    sections: {
        ...state.sections,
        [payload.name]: {
            ...state.sections[payload.name],
            ...payload
        }
    }
});

export default updateSectionHandler;