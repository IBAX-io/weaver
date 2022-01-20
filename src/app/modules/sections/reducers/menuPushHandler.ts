/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { menuPush } from '../actions';
import { Reducer } from 'modules';
import upsertSectionMenu from '../util/upsertSectionMenu';

const menuPushHandler: Reducer<typeof menuPush, State> = (state, payload): State => ({
    ...state,
    sections: {
        ...state.sections,
        [payload.section]: upsertSectionMenu(state.sections[payload.section], payload.menu)
    }
});

export default menuPushHandler;