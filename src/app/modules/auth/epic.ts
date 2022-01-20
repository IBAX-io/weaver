/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { combineEpics } from 'redux-observable';
import loginEpic from './epics/loginEpic';
import logoutEpic from './epics/logoutEpic';
import authorizeEpic from './epics/authorizeEpic';
import createWalletEpic from './epics/createWalletEpic';
import importWalletEpic from './epics/importWalletEpic';
import authErrorEpic from './epics/authErrorEpic';
import removeWalletEpic from './epics/removeWalletEpic';
import logoutEmptySessionEpic from './epics/logoutEmptySessionEpic';
import changePasswordEpic from './epics/changePasswordEpic';
import changePasswordDoneEpic from './epics/changePasswordDoneEpic';
import loadWalletsEpic from './epics/loadWalletsEpic';
import reloadWalletsEpic from './epics/reloadWalletsEpic';
import loadSavedWalletEpic from './epics/loadSavedWalletEpic';
import switchWalletEpic from './epics/switchWalletEpic';
import loginGuestEpic from './epics/loginGuestEpic';
import acquireSessionEpic from './epics/acquireSessionEpic';
import backupAccountEpic from './epics/backupAccountEpic';

export default combineEpics(
    acquireSessionEpic,
    authorizeEpic,
    createWalletEpic,
    importWalletEpic,
    loginEpic,
    authErrorEpic,
    logoutEmptySessionEpic,
    logoutEpic,
    removeWalletEpic,
    loadWalletsEpic,
    loadSavedWalletEpic,
    reloadWalletsEpic,
    changePasswordEpic,
    changePasswordDoneEpic,
    switchWalletEpic,
    loginGuestEpic,
    backupAccountEpic
);