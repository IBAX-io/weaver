
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow, shell } from 'electron';
import config from '../config';
import calcScreenOffset from '../util/calcScreenOffset';

export default () => {
  const options = {
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#244134',
    resizable: true,
    show: false,
    maximized: config.get('maximized') || false,
    ...calcScreenOffset(config.get('dimensions') || { width: 800, height: 600 })
  };

  const window = new BrowserWindow(options);

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('close', () => {
    config.set('dimensions', window.getBounds());
    config.set('maximized', window.isMaximized() || window.isMaximized);
  });

  window.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  return window;
};