/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { State } from '../reducer';

export default function (state: State, payload: { type: string, id: string }): number {
    return state.tabs.findIndex(l =>
        l.type === payload.type &&
        l.id === payload.id
    );
}