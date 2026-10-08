/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { screen, Rectangle } from 'electron';
import args from '../args';

// Centers the window and shifts it by --offset-x/--offset-y; without both offsets the OS places it
export default function calcScreenOffset(sourceRect: { width: number, height: number }): Partial<Rectangle> & { width: number, height: number } {
    const x = args.offsetX;
    const y = args.offsetY;

    if ('number' === typeof x && 'number' === typeof y) {
        const primaryDisplay = screen.getPrimaryDisplay();
        return {
            x: Math.round((primaryDisplay.workArea.width / 2) - (sourceRect.width / 2) + x),
            y: Math.round((primaryDisplay.workArea.height / 2) - (sourceRect.height / 2) + y),
            width: sourceRect.width,
            height: sourceRect.height
        };
    }

    return {
        width: sourceRect.width,
        height: sourceRect.height
    };
}
