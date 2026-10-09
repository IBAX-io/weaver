/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import IbaxAPI, { IRequest } from 'lib/ibaxAPI';
import { UntrustedNodeError } from 'lib/ibaxAPI/errors';
import { DEFAULT_CRYPTO_SUITE, resolveCryptoSuite } from 'lib/crypto/suites';
import { hexToBytes } from '@noble/hashes/utils.js';
import { IPkcs11 } from 'ibax/pkcs11';
import { FipsSignerRequiredError, moduleKey, softwareKey } from 'lib/crypto/signer';
import { authenticate, authenticateGuest, E_REGISTRATION } from '.';

const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';
const KEY = softwareKey(PRIVATE_KEY);

// A node that answers /getuid with the given challenge and records every request
const createNode = (uid: { [key: string]: unknown }) => {
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
        const auth = await authenticate(client, KEY, { networkID: 5 });

        expect(auth.networkID).toBe(5);
        expect(logins()).toHaveLength(1);
        const signature = String((logins()[0].body as FormData).get('signature'));
        const suite = resolveCryptoSuite(DEFAULT_CRYPTO_SUITE);
        expect(suite.verify('LOGIN57340221', signature, suite.publicKey(PRIVATE_KEY))).toBe(true);
    });

    it('signs nothing for a node of another network', async () => {
        const { client, logins } = createNode({ uid: '7340221', network_id: '6' });

        await expect(authenticate(client, KEY, { networkID: 5 })).rejects.toEqual(new UntrustedNodeError('network'));
        expect(logins()).toHaveLength(0);
    });

    it('signs nothing when the selected network is not known', async () => {
        const { client, logins } = createNode({ uid: '7340221', network_id: '5' });

        await expect(authenticate(client, KEY, { networkID: undefined })).rejects.toEqual(new UntrustedNodeError('network'));
        expect(logins()).toHaveLength(0);
    });

    it('signs nothing but a login challenge', async () => {
        for (const uid of [
            { uid: '7340221 transfer 1000', network_id: '5' },
            { uid: '7340221', network_id: '5x' },
            { uid: '', network_id: '5' }
        ]) {
            const { client, logins } = createNode(uid);
            await expect(authenticate(client, KEY, { networkID: 5 })).rejects.toEqual(new UntrustedNodeError('challenge'));
            expect(logins()).toHaveLength(0);
        }
    });
});

const P256 = { cryptoer: 'ECC_P256', hasher: 'SHA256' } as const;
const P256_SUITE = resolveCryptoSuite(P256);
const MODULE_PUBLIC_KEY = P256_SUITE.publicKey(PRIVATE_KEY);
const MODULE_KEY = moduleKey({ token: { serial: 'T1', label: 'Token' }, id: '01', label: 'Key', cryptoer: 'ECC_P256', publicKey: MODULE_PUBLIC_KEY });

// A module that hashes with the requested hasher and signs the digest, as a token does
const fakeModule = (): IPkcs11 & { signed: number } => {
    const module = {
        signed: 0,
        sign: async (request: Parameters<IPkcs11['sign']>[0]) => {
            module.signed++;
            return resolveCryptoSuite({ cryptoer: request.cryptoer, hasher: request.hasher }).sign(hexToBytes(request.data), PRIVATE_KEY);
        }
    };
    return module as unknown as IPkcs11 & { signed: number };
};

describe('authenticateGuest', () => {
    it('signs nothing, whatever the network', async () => {
        const { client, logins } = createNode({ uid: '7340221', network_id: '5', ...P256 });
        const auth = await authenticateGuest(client, { networkID: 5 });

        expect(auth.fips).toBe(false);
        const body = logins()[0].body as FormData;
        expect(body.get('guest')).toBe('true');
        expect(body.get('signature')).toBeNull();
    });
});

describe('authenticate on a FIPS network', () => {
    const FIPS_NODE = { uid: '7340221', network_id: '5', cryptoer: 'ECC_P256', hasher: 'SHA256', fips: true };

    it('signs nothing with a key in memory', async () => {
        const { client, logins } = createNode(FIPS_NODE);

        await expect(authenticate(client, KEY, { networkID: 5 })).rejects.toBeInstanceOf(FipsSignerRequiredError);
        expect(logins()).toHaveLength(0);
    });

    it('signs the challenge in the module', async () => {
        const { client, logins } = createNode(FIPS_NODE);
        const pkcs11 = fakeModule();
        const auth = await authenticate(client, MODULE_KEY, { networkID: 5, pkcs11 });

        expect(auth.fips).toBe(true);
        expect(auth.publicKey).toBe(MODULE_PUBLIC_KEY);
        expect(pkcs11.signed).toBe(1);
        const signature = String((logins()[0].body as FormData).get('signature'));
        expect(P256_SUITE.verify('LOGIN57340221', signature, MODULE_PUBLIC_KEY)).toBe(true);
    });

    it('asks for the guest session without a signature', async () => {
        const { client, logins } = createNode(FIPS_NODE);
        const auth = await authenticateGuest(client, { networkID: 5 });

        expect(auth.fips).toBe(true);
        const body = logins()[0].body as FormData;
        expect(body.get('guest')).toBe('true');
        expect(body.get('signature')).toBeNull();
        expect(body.get('pubkey')).toBeNull();
        // For the node's own challenge (go-ibax getUID): without it, E_UNKNOWNUID
        expect(logins()[0].headers.Authorization).toBe('Bearer uid-token');
    });
});

// A node that does not know the key until its @1NewUser is in a block (or refuses it)
const createRegistrationNode = (txStatus: { [key: string]: unknown } = { blockid: '12', penalty: 0, result: '' }) => {
    const requests: IRequest[] = [];
    let challenges = 0;
    let registered = false;
    const client = new IbaxAPI({
        apiHost: 'http://node',
        transport: async request => {
            requests.push(request);
            if (request.url.includes('/getuid')) {
                challenges++;
                return { json: { token: `uid-token-${challenges}`, uid: `734022${challenges}`, network_id: '5', ...DEFAULT_CRYPTO_SUITE }, body: '' };
            }
            if (request.url.includes('/contract/')) {
                return { json: { id: 37, name: '@1NewUser', active: true, tableid: 0, fields: [] }, body: '' };
            }
            if (request.url.includes('/sendTx')) {
                const hashes = [...(request.body as FormData).keys()];
                return { json: { hashes: Object.fromEntries(hashes.map(hash => [hash, hash])) }, body: '' };
            }
            if (request.url.includes('/txstatus')) {
                const { hashes } = JSON.parse(String((request.body as FormData).get('data'))) as { hashes: string[] };
                registered = !txStatus.errmsg;
                return { json: { results: Object.fromEntries(hashes.map(hash => [hash, txStatus])) }, body: '' };
            }
            if (!registered) {
                return { json: { error: 'E_NEWUSER', msg: 'The key is not registered in the ecosystem' }, body: '' };
            }
            return { json: { token: 'session', account: '0000-0000-0000-0000-0000', key_id: '1', ecosystem_id: '1', roles: [] }, body: '' };
        }
    });
    const sent = (path: string) => requests.filter(request => request.url.includes(path));
    return { client, sent };
};

describe('authenticate with a new key', () => {
    it('registers the key with the registrar, then signs a new challenge', async () => {
        const { client, sent } = createRegistrationNode();
        const registrar = client.authorize('guest-session');
        const auth = await authenticate(client, KEY, { networkID: 5, ecosystem: '3', registrar });

        expect(auth.result.token).toBe('session');
        const logins = sent('/login');
        expect(logins).toHaveLength(2);
        expect(logins[0].headers.Authorization).toBe('Bearer uid-token-1');
        expect(logins[1].headers.Authorization).toBe('Bearer uid-token-2');
        const suite = resolveCryptoSuite(DEFAULT_CRYPTO_SUITE);
        expect(suite.verify('LOGIN57340222', String((logins[1].body as FormData).get('signature')), suite.publicKey(PRIVATE_KEY))).toBe(true);

        expect(sent('/contract/')[0].url).toContain(encodeURIComponent('@1NewUser'));
        const [send] = sent('/sendTx');
        expect(send.headers.Authorization).toBe('Bearer guest-session');
        expect([...(send.body as FormData).keys()]).toHaveLength(1);
    }, 10000);

    it('throws E_REGISTRATION when the chain refuses it, and signs in no more', async () => {
        const { client, sent } = createRegistrationNode({ blockid: '', penalty: 1, result: '', errmsg: { type: 'warning', error: 'NewUser must be signed with the key it registers' } });
        const registrar = client.authorize('guest-session');

        await expect(authenticate(client, KEY, { networkID: 5, registrar })).rejects.toEqual({
            error: E_REGISTRATION,
            msg: 'NewUser must be signed with the key it registers'
        });
        expect(sent('/login')).toHaveLength(1);
    }, 10000);

    it('leaves E_NEWUSER to the caller without a registrar', async () => {
        const { client, sent } = createRegistrationNode();

        await expect(authenticate(client, KEY, { networkID: 5 })).rejects.toMatchObject({ error: 'E_NEWUSER' });
        expect(sent('/sendTx')).toHaveLength(0);
    });
});
