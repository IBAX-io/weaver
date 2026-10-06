/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IInferredArguments } from 'ibax/gui';
import desktop from 'lib/desktop';

export type TPlatformType =
    'desktop' | 'web' | 'win32' | 'linux' | 'darwin';

const platform: TPlatformType = desktop ? 'desktop' : 'web';
const os = desktop ? desktop.platform : null;
const args: IInferredArguments = desktop ? desktop.args : {};

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
        if (desktop && os in platforms && platforms[os as keyof typeof platforms]) {
            return platforms[os as keyof typeof platforms];
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
