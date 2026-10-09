/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { parseArgs } from 'node:util';
import { IInferredArguments, ILaunchArguments } from 'ibax/gui';
import { hasProtocol, isHttpUrl } from './util/navigation';

const toInteger = (value: string | undefined) => {
    if (undefined === value || !/^-?\d+$/.test(value.trim())) {
        return undefined;
    }
    return parseInt(value, 10);
};

// Launch arguments after the executable. Positionals (the app path when started through the
// electron CLI), unknown switches (Chromium/Electron, debugger) and the process serial number
// macOS adds when an app is opened from Finder (-psn_0_123) are ignored.
export const parseLaunchArgs = (argv: string[]): ILaunchArguments => {
    const { values } = parseArgs({
        args: argv.filter(arg => !arg.startsWith('-psn_')),
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
            'dev-server': { type: 'string' },
            'pkcs11-module': { type: 'string' }
        }
    });
    const text = (name: string) => typeof values[name] === 'string' ? values[name] as string : undefined;
    const flag = (name: string) => values[name] === true ? true : undefined;
    const fullNodes = values['full-node'];
    const dry = flag('dry');
    const socketUrl = text('socket-url');

    return {
        // A key on the command line ends up stored with the default password: throwaway profiles only
        privateKey: dry ? text('private-key') : undefined,
        fullNode: Array.isArray(fullNodes) ? fullNodes.filter((node): node is string => 'string' === typeof node && isHttpUrl(node)) : undefined,
        dry,
        offsetX: toInteger(text('offset-x')),
        offsetY: toInteger(text('offset-y')),
        networkID: toInteger(text('network-id')),
        networkName: text('network-name'),
        socketUrl: hasProtocol(socketUrl, ['ws:', 'wss:', 'http:', 'https:']) ? socketUrl : undefined,
        disableHonorNodesSync: flag('disable-full-nodes-sync'),
        activationEmail: text('activation-email'),
        guestMode: flag('guest-mode'),
        devServer: text('dev-server'),
        pkcs11Module: text('pkcs11-module')
    };
};

// What the page may know about the launch: no key, no window placement, no dev server
export const pageArguments = (launch: ILaunchArguments): IInferredArguments => ({
    fullNode: launch.fullNode,
    networkID: launch.networkID,
    networkName: launch.networkName,
    dry: launch.dry,
    socketUrl: launch.socketUrl,
    disableHonorNodesSync: launch.disableHonorNodesSync,
    activationEmail: launch.activationEmail,
    guestMode: launch.guestMode
});

const args = parseLaunchArgs(process.argv.slice(1));

export default args;
