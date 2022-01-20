
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { screen, Rectangle } from 'electron';
import args from '../args';

export default function calcScreenOffset(sourceRect: { width: number, height: number }): Rectangle {
  const x = args.offsetX;
  const y = args.offsetY;

  if (x === x && y === y) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const resultX = Math.round((primaryDisplay.workArea.width / 2) - (sourceRect.width / 2) + x);
    const resultY = Math.round((primaryDisplay.workArea.height / 2) - (sourceRect.height / 2) + y);

    return {
      x: resultX,
      y: resultY,
      width: sourceRect.width,
      height: sourceRect.height
    };
  }
  else {
    return {
      x: null,
      y: null,
      width: sourceRect.width,
      height: sourceRect.height
    };
  }
}