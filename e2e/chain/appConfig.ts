/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// What the app is served with besides its code, in place of modules/engine/util/ConfigObservable
// (which fetches it, as a browser does): settings.json as a deployment for the test network writes
// it, and the files of public/ as shipped. A test file mocks the module with this one:
//   vi.mock('modules/engine/util/ConfigObservable', () => import('./appConfig'));
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { of } from 'rxjs';

export interface ISettingsNetwork {
    key: string;
    name: string;
    networkID: number;
    honorNodes: string[];
    socketUrl?: string;
    disableSync?: boolean;
}

export interface ISettings {
    defaultLocale: string;
    defaultNetwork: string;
    networks: ISettingsNetwork[];
}

// A deployment of the app for one network, which the app connects to by default
export const settingsFor = (network: ISettingsNetwork): ISettings => ({
    defaultLocale: 'en-US',
    defaultNetwork: network.key,
    networks: [network]
});

let served: ISettings | null = null;

// The settings the next client to start is served
export const serveSettings = (settings: ISettings) => {
    served = settings;
};

const ConfigObservable = (name: string) => of('settings' === name
    ? served
    : JSON.parse(readFileSync(path.resolve('public', `${name}.json`), 'utf8')));

export default ConfigObservable;
