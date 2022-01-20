/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInferredArguments } from 'ibax/gui';

export type TPlatformType =
    'desktop' | 'web' | 'win32' | 'linux' | 'darwin';

const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
const platform: TPlatformType = isElectron ? 'desktop' : 'web';

let os: NodeJS.Platform = null;
let args: IInferredArguments = {};

if (isElectron) {
    const electron = require('electron');
    const process: NodeJS.Process = require('process');
    os = process.platform;
    args = electron.ipcRenderer.sendSync('getArgs') || {};
}

export default {
    // Platform.select will return only 1 value depending on which platform
    // this application runs. If 'desktop' is specified instead of providing
    // extact platform name - it will be returned instead
    select: function <T>(platforms: {
        desktop?: T,
        web?: T,
        win32?: T,
        linux?: T,
        darwin?: T
    }): T {
        if (isElectron && platforms[os]) {
            return platforms[os];
        }
        else {
            return platforms[platform];
        }
    },

    on: (platformType: TPlatformType, callback: () => void) => {
        if (platformType === platform) {
            callback();
        }
    },

    args
};