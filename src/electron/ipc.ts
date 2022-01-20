/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ipcMain, Event } from 'electron';
import config from './config';
import args from './args';
import * as _ from 'lodash';

export let state: any = null;
let saveState = () => null as any;

const truncateState = (value: any) => {
  if (!value) {
    return value;
  }

  const storage = value.storage || {};
  const engine = value.engine || {};
  const auth = value.auth || {};

  return {
    storage,
    engine: {
      guestSession: engine.guestSession,
    },
    auth: {
      isAuthenticated: auth.isAuthenticated,
      isDefaultWallet: auth.isDefaultWallet,
      session: auth.session,
      id: auth.id,
      wallet: auth.wallet
    }
  };
};

if (!args.dry) {
  try {
    state = JSON.parse(config.get('persistentData'));
  }
  catch {
    // Suppress errors
  }

  saveState = _.throttle(() => {
    config.set('persistentData', JSON.stringify(truncateState(state)));
  }, 1000, { leading: true });
}

ipcMain.on('setState', (e: Event, updatedState: any) => {
  state = updatedState;
  saveState();
});

ipcMain.on('getState', (e: Event) => {
  e.returnValue = truncateState(state);
});

ipcMain.on('getArgs', (e: Event) => {
  e.returnValue = args;
});