/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MenuItemConstructorOptions, app, Menu } from 'electron';
import { window } from './windows';

const template: MenuItemConstructorOptions[] = [
  {
    label: 'Ibax',
    submenu: [
      { label: 'Quit', accelerator: 'Command+Q', click: app.quit }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Toggle Developer Tools', click: () => {
          if (window) {
            window.webContents.openDevTools({
              mode: 'detach'
            });
          }
        }
      }
    ]
  }
];

export default Menu.buildFromTemplate(template);