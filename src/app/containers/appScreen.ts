/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRootState } from 'modules';

export type TScreen = 'error' | 'splash' | 'auth' | 'retry' | 'main';

// The screen the app shows: the first condition that holds decides, in this order
export const selectScreen = (state: IRootState): TScreen => {
    if (state.engine.fatalError) {
        return 'error';
    }
    if (!state.engine.isLoaded) {
        return 'splash';
    }
    if (!state.auth.isAuthenticated) {
        return 'auth';
    }
    if (!state.auth.isAcquired) {
        // The restored session is being asked for again: the node did not answer
        return state.auth.sessionRetryReason ? 'retry' : 'splash';
    }
    return 'main';
};
