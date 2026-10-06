/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { shell } from 'electron';
import { isExternalUrlAllowed } from './navigation';

// The one place the app hands a URL to the OS
export const openExternalIfAllowed = (url: string) => {
    if (isExternalUrlAllowed(url)) {
        shell.openExternal(url);
    }
};
