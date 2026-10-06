/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import IbaxAPI, { IRequest } from 'lib/ibaxAPI';
import { UntrustedNodeError } from 'lib/ibaxAPI/errors';
import { DEFAULT_CRYPTO_SUITE, resolveCryptoSuite } from 'lib/crypto/suites';
import { authenticate } from '.';

const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';

// A node that answers /getuid with the given challenge and records every request
const createNode = (uid: { [key: string]: string }) => {
    const requests: IRequest[] = [];
    const client = new IbaxAPI({
        apiHost: 'http://node',
        transport: async request => {
            requests.push(request);
            if (request.url.includes('/getuid')) {
                return { json: { token: 'uid-token', ...DEFAULT_CRYPTO_SUITE, ...uid }, body: '' };
            }
            return { json: { token: 'session', account: '0000-0000-0000-0000-0000', key_id: '1', ecosystem_id: '1', roles: [] }, body: '' };
        }
    });
    const logins = () => requests.filter(request => request.url.includes('/login'));
    return { client, logins };
};

describe('authenticate', () => {
    it('signs the login challenge of a node of the selected network', async () => {
        const { client, logins } = createNode({ uid: '7340221', network_id: '5' });
        const auth = await authenticate(client, PRIVATE_KEY, { networkID: 5 });

        expect(auth.networkID).toBe(5);
        expect(logins()).toHaveLength(1);
        const signature = String((logins()[0].body as FormData).get('signature'));
        const suite = resolveCryptoSuite(DEFAULT_CRYPTO_SUITE);
        expect(suite.verify('LOGIN57340221', signature, suite.publicKey(PRIVATE_KEY))).toBe(true);
    });

    it('signs nothing for a node of another network', async () => {
        const { client, logins } = createNode({ uid: '7340221', network_id: '6' });

        await expect(authenticate(client, PRIVATE_KEY, { networkID: 5 })).rejects.toEqual(new UntrustedNodeError('network'));
        expect(logins()).toHaveLength(0);
    });

    it('signs nothing when the selected network is not known', async () => {
        const { client, logins } = createNode({ uid: '7340221', network_id: '5' });

        await expect(authenticate(client, PRIVATE_KEY, { networkID: undefined })).rejects.toEqual(new UntrustedNodeError('network'));
        expect(logins()).toHaveLength(0);
    });

    it('signs nothing but a login challenge', async () => {
        for (const uid of [
            { uid: '7340221 transfer 1000', network_id: '5' },
            { uid: '7340221', network_id: '5x' },
            { uid: '', network_id: '5' }
        ]) {
            const { client, logins } = createNode(uid);
            await expect(authenticate(client, PRIVATE_KEY, { networkID: 5 })).rejects.toEqual(new UntrustedNodeError('challenge'));
            expect(logins()).toHaveLength(0);
        }
    });
});
