/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import * as url from 'url';
import menu from '../menu';
import mainWindow from './main';

export let window: BrowserWindow;

const ENV = process.env.NODE_ENV || 'production';
const PROTOCOL = process.env.HTTPS === 'true' ? 'https' : 'http';
const PORT = parseInt(process.env.PORT || '', 10) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

export const appUrl =
  ENV !== 'production'
    ? `${PROTOCOL}://${HOST}:${PORT}`
    : url.format({
      pathname: path.join(__dirname, '../../', 'app', 'index.html'),
      protocol: 'file:',
      slashes: true,
    });

export const spawnWindow = () => {
  let wnd: BrowserWindow = mainWindow();

  if (window) {
    window.close();
    window.destroy();
  }

  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(menu);
    wnd.setMenu(menu);
  }

  wnd.loadURL(appUrl);

  wnd.on('closed', () => {
    window = null;
  });

  window = wnd;
};