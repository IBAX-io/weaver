/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { parseLaunchArgs } from './args';

describe('parseLaunchArgs', () => {
    it('reads every option the app understands', () => {
        expect(parseLaunchArgs([
            '-n', 'https://a:5079', '--full-node', 'https://b:5079',
            '-k', 'ab'.repeat(32), '-d', '-x', '-20', '-y', '15', '-i', '5', '-m', 'Testnet',
            '-s', 'wss://socket', '-u', '-g', '-e', 'ops@example.com', '--dev-server=http://127.0.0.1:3000'
        ])).toEqual({
            fullNode: ['https://a:5079', 'https://b:5079'],
            privateKey: 'ab'.repeat(32),
            dry: true,
            offsetX: -20,
            offsetY: 15,
            networkID: 5,
            networkName: 'Testnet',
            socketUrl: 'wss://socket',
            disableHonorNodesSync: true,
            activationEmail: 'ops@example.com',
            guestMode: true,
            devServer: 'http://127.0.0.1:3000'
        });
    });

    it('leaves options that were not given undefined', () => {
        const parsed = parseLaunchArgs([]);
        expect(Object.values(parsed).every(value => value === undefined)).toBe(true);
    });

    it('ignores Chromium switches and bad numbers', () => {
        expect(parseLaunchArgs(['--inspect=9229', '--no-sandbox', '-i', 'five', '--offset-x', '1.5', 'positional'])).toEqual(
            expect.objectContaining({ networkID: undefined, offsetX: undefined })
        );
    });
});
