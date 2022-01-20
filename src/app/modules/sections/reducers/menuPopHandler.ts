/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';
import { menuPop } from '../actions';
import { Reducer } from 'modules';

const menuPopHandler: Reducer<typeof menuPop, State> = (state, section): State => {
    if (1 >= state.sections[section].menus.length) {
        return state;
    }

    return {
        ...state,
        sections: {
            ...state.sections,
            [section]: {
                ...state.sections[section],
                menus: state.sections[section].menus.slice(0, -1)
            }
        }
    };
};

export default menuPopHandler;