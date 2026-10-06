
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow, shell } from 'electron';
import { enable as remoteEnable } from '@electron/remote/main';
import config from '../config';
import calcScreenOffset from '../util/calcScreenOffset';
import { isAppNavigation, isExternalUrlAllowed } from '../util/navigation';

export default (appUrl: string) => {
  const options = {
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#244134',
    resizable: true,
    show: false,
    maximized: config.get('maximized') || false,
    ...calcScreenOffset(config.get('dimensions') || { width: 800, height: 600 }),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  };

  const window = new BrowserWindow(options);
  remoteEnable(window.webContents);

  window.once('ready-to-show', () => {
    window.show();
  });

  window.on('close', () => {
    config.set('dimensions', window.getBounds());
    config.set('maximized', window.isMaximized());
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrlAllowed(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isAppNavigation(url, appUrl)) {
      event.preventDefault();
      if (isExternalUrlAllowed(url)) {
        shell.openExternal(url);
      }
    }
  });

  window.webContents.on('will-attach-webview', event => {
    event.preventDefault();
  });

  return window;
};