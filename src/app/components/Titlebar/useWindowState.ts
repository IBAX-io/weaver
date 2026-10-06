/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { useEffect, useState } from 'react';
import { IDesktopBridge, IDesktopWindowState } from 'ibax/gui';

// The desktop window's state, kept in sync with the window (src/electron/util/windowState.ts)
export const useWindowState = (bridge: IDesktopBridge): IDesktopWindowState => {
    const [state, setState] = useState<IDesktopWindowState>({ maximized: false, focused: document.hasFocus() });

    useEffect(() => {
        let mounted = true;
        const unsubscribe = bridge.onWindowState(setState);
        bridge.getWindowState().then(current => {
            if (mounted && current) {
                setState(current);
            }
        });
        return () => {
            mounted = false;
            unsubscribe();
        };
    }, [bridge]);

    return state;
};
