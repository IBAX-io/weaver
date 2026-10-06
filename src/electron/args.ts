/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseArgs } from 'node:util';
import { IInferredArguments } from 'ibax/gui';

const toInteger = (value: string | undefined) => {
    if (undefined === value || !/^-?\d+$/.test(value.trim())) {
        return undefined;
    }
    return parseInt(value, 10);
};

// Launch arguments after the executable. Positionals (the app path when started through the
// electron CLI) and unknown switches (Chromium/Electron, debugger) are ignored.
export const parseLaunchArgs = (argv: string[]): IInferredArguments => {
    const { values } = parseArgs({
        args: argv,
        strict: false,
        allowPositionals: true,
        options: {
            'full-node': { type: 'string', short: 'n', multiple: true },
            'private-key': { type: 'string', short: 'k' },
            'dry': { type: 'boolean', short: 'd' },
            'offset-x': { type: 'string', short: 'x' },
            'offset-y': { type: 'string', short: 'y' },
            'network-id': { type: 'string', short: 'i' },
            'network-name': { type: 'string', short: 'm' },
            'socket-url': { type: 'string', short: 's' },
            'disable-full-nodes-sync': { type: 'boolean', short: 'u' },
            'guest-mode': { type: 'boolean', short: 'g' },
            'activation-email': { type: 'string', short: 'e' },
            'dev-server': { type: 'string' }
        }
    });
    const text = (name: string) => typeof values[name] === 'string' ? values[name] as string : undefined;
    const flag = (name: string) => values[name] === true ? true : undefined;
    const fullNodes = values['full-node'];

    return {
        privateKey: text('private-key'),
        fullNode: Array.isArray(fullNodes) ? fullNodes.filter((node): node is string => typeof node === 'string') : undefined,
        dry: flag('dry'),
        offsetX: toInteger(text('offset-x')),
        offsetY: toInteger(text('offset-y')),
        networkID: toInteger(text('network-id')),
        networkName: text('network-name'),
        socketUrl: text('socket-url'),
        disableHonorNodesSync: flag('disable-full-nodes-sync'),
        activationEmail: text('activation-email'),
        guestMode: flag('guest-mode'),
        devServer: text('dev-server')
    };
};

const args = parseLaunchArgs(process.argv.slice(1));

export default args;
