/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { ISession } from 'ibax/auth';
import { runEpic } from 'test/runEpic';
import { cryptoSuiteFromNode, DEFAULT_CRYPTO_SUITE, ICryptoSuiteId } from 'lib/crypto/suites';
import { modalShow } from 'modules/modal/actions';
import { sectionsInit } from 'modules/sections/actions';
import IbaxAPI from 'lib/ibaxAPI';
import { acquireSession } from '../actions';
import acquireSessionEpic from './acquireSessionEpic';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };

// The node: the suite its /getuid reports now, and one section
const nodeReporting = (suite: ICryptoSuiteId) => {
    const client = {
        // As the client reads /getuid (lib/ibaxAPI): the suite from cryptoer and hasher
        getUid: vi.fn(async () => ({ token: '', networkID: 1, uid: 'LOGIN11', cryptoSuite: cryptoSuiteFromNode(suite.cryptoer, suite.hasher) })),
        sections: vi.fn(async () => ({ list: [{ urlname: 'home', title: 'Home', page: 'default_page', status: '2' }] })),
        getParam: vi.fn(async () => ({ value: '' }))
    };
    return { client, api: (() => client) as unknown as (params: unknown) => IbaxAPI };
};

describe('acquireSessionEpic', () => {
    it('restores a session whose key algorithms the network still uses', async () => {
        const { client, api } = nodeReporting(DEFAULT_CRYPTO_SUITE);
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], undefined, { api });
        expect(out.map(action => action.type)).toContain(sectionsInit.type);
        expect(out).toContainEqual(acquireSession.done({ params: session, result: true }));
        expect(client.getUid).toHaveBeenCalledTimes(1);
    });

    it('ends a session signed in under algorithms the network no longer uses, and says why', async () => {
        // The chain's settings changed from secp256k1/Keccak-256 to SM2/SM3 since the user signed in
        const { client, api } = nodeReporting({ cryptoer: 'SM2', hasher: 'SM3' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], undefined, { api });
        expect(out).toEqual([
            acquireSession.failed({ params: session, error: 'E_CRYPTO_CHANGED' }),
            modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: 'E_CRYPTO_CHANGED' } })
        ]);
        // Nothing loaded under the old session
        expect(client.sections).not.toHaveBeenCalled();
    });

    it('tells a change of the hash alone too', async () => {
        const { api } = nodeReporting({ cryptoer: 'ECC_Secp256k1', hasher: 'SHA256' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], undefined, { api });
        expect(out[0]).toEqual(acquireSession.failed({ params: session, error: 'E_CRYPTO_CHANGED' }));
    });
});
