/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The client's session when the network's key algorithms change under it, run as the app runs:
// its reducers and epics against a local network with Centrifugo. A chain's suite changes by
// redeploying it (new genesis behind the same node addresses): a go-ibax node refuses to start under
// another suite than its genesis block's. The cases build on each other, in order.
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it, onTestFailed, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { rmSync } from 'node:fs';
import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import path from 'node:path';
import { Action } from 'redux';
import IbaxAPI from 'lib/ibaxAPI';
import { cryptoSuiteKey, ICryptoSuiteId, LEGACY_CRYPTO_SUITE, resolveCryptoSuite } from 'lib/crypto/suites';
import { IModuleKeyRef } from 'ibax/auth';
import { isValidPrivateKey } from 'lib/keyring';
import { moduleKey, softwareKey } from 'lib/crypto/signer';
import { signTransaction } from 'lib/tx/transaction';
import dependencies from 'modules/dependencies';
import { acquireSession, addModuleWallet, cryptoChanged, importWallet, ISignOutReason, loadWallets, login, logout, selectWallet, sessionExpired, TSignOutReason } from 'modules/auth/actions';
import { SESSION_RETRY_MS } from 'modules/auth/util/sessionRetry';
import { modalShow } from 'modules/modal/actions';
import { reconnected } from 'modules/socket/actions';
import { txExec } from 'modules/tx/actions';
import { sendTransfer } from 'modules/wallet/actions';
import { TPersistedState } from 'lib/persistence';
import { FIPS_MODULE, ILocalCentrifugo, ILocalNetwork, startCentrifugo, startNetwork } from './localChain';
import { execute, maxBlockID, operatorSigner, register, sleep } from './chainApi';
import { ISoftToken, startSoftToken, USER_PIN } from './softToken';
import { describeActions, IClient, startClient, TDialogAnswer } from './clientStore';
import { ISettings, ISettingsNetwork, settingsFor } from './appConfig';

vi.mock('modules/engine/util/ConfigObservable', () => import('./appConfig'));

const NETWORK_ID = 7;
// Two suites the node runs in either mode (see localChain's nodeRuns): FIPS mode has no other
// cryptoer than ECC_P256 in every module
const [A, B]: ICryptoSuiteId[] = FIPS_MODULE
    ? [{ cryptoer: 'ECC_P256', hasher: 'SHA3_256' }, { cryptoer: 'ECC_P256', hasher: 'SHA384' }]
    : [{ cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' }, { cryptoer: 'SM2', hasher: 'SM3' }];
const PASSWORD = 'e2e-password';
// 1 coin in base units (12 digits)
const COIN = '1000000000000';

// A key valid for every suite's curve
const newUserKey = (): string => {
    for (;;) {
        const key = randomBytes(32).toString('hex');
        if (isValidPrivateKey(key)) {
            return key;
        }
    }
};
const USER_KEY = newUserKey();

// In FIPS mode the user's key is on a SoftHSM token (an ECC_P256 key serves both suites), and the
// user enters its PIN where a password is asked for
let token: ISoftToken | null = null;
let userModuleKey: IModuleKeyRef | null = null;
const SECRET = FIPS_MODULE ? USER_PIN : PASSWORD;

const keyIDOf = (suite: ICryptoSuiteId) => {
    const crypto = resolveCryptoSuite(suite);
    return crypto.keyID(userModuleKey ? userModuleKey.publicKey : crypto.publicKey(USER_KEY));
};

const sameSuite = (a: ICryptoSuiteId | undefined, b: ICryptoSuiteId) => !!a && cryptoSuiteKey(a) === cryptoSuiteKey(b);

// The user confirms every transfer and enters the password when asked
const answer: TDialogAnswer = modal => {
    if ('WALLET_TRANSFER_CONFIRM' === modal.id) {
        return { data: true };
    }
    if ('AUTHORIZE' === modal.type) {
        return { data: SECRET };
    }
    return undefined;
};

const modalsShown = (client: IClient, from = 0) =>
    client.actions.slice(from).filter(modalShow.match).map(action => action.payload.type);

const actionsSince = (client: IClient, from: number) => client.actions.slice(from).map(action => action.type);

// The network as a new user finds it: the guest key the app signs in with to discover a network,
// and the user's account under the chain's suite, with coins from the founder
const prepare = async (network: ILocalNetwork) => {
    const founder = network.nodes[0];
    const api = new IbaxAPI({ apiHost: founder.apiHost });
    await register(api, softwareKey(dependencies.defaultKey), NETWORK_ID);
    if (userModuleKey) {
        // A client may have logged out of the token meanwhile
        await token.pkcs11.login(token.serial, USER_PIN);
        await register(api, moduleKey(userModuleKey), NETWORK_ID, token.pkcs11);
    }
    else {
        await register(api, softwareKey(USER_KEY), NETWORK_ID);
    }
    const session = await register(api, softwareKey(founder.privateKey), NETWORK_ID);
    await execute(api.authorize(session.result.token), await signTransaction(
        { ecosystemID: 1, networkID: NETWORK_ID, cryptoSuite: network.suite },
        { type: 'utxo', toID: keyIDOf(network.suite), value: `${100n * BigInt(COIN)}`, comment: '' },
        operatorSigner(founder.privateKey, network.suite)
    ));
};

// What the user does on the sign-in page of the app deployed for the network (which the app
// connects to by itself at start): imports the key once (in FIPS mode: adds the token's key), picks
// the account and enters the password (the PIN)
const signIn = async (client: IClient, suite: ICryptoSuiteId) => {
    await client.waitFor(state => sameSuite(state.engine.guestSession?.cryptoSuite, suite), `the network discovered under ${cryptoSuiteKey(suite)}`);
    if (!client.store.getState().storage.wallets.length) {
        client.dispatch(userModuleKey
            ? addModuleWallet.started(userModuleKey)
            : importWallet.started({ backup: USER_KEY, password: PASSWORD }));
        await client.waitFor(state => state.storage.wallets.length > 0, 'the imported wallet stored');
    }

    const from = client.actions.length;
    client.dispatch(loadWallets.started(undefined));
    const loaded = await client.waitForAction(loadWallets.done.match, 'the accounts loaded', from);
    const account = loaded.payload.result.find(wallet => wallet.id === keyIDOf(suite));
    expect(account, `the account ${keyIDOf(suite)} under ${cryptoSuiteKey(suite)}`).toBeDefined();
    const access = account.access.find(ecosystem => '1' === ecosystem.ecosystem);
    expect(access, 'access to ecosystem 1').toBeDefined();

    client.dispatch(selectWallet({ wallet: account, access }));
    client.dispatch(login.started({ password: SECRET }));
    await client.waitFor(state => state.auth.isAcquired, 'the session acquired');
    expect(client.screen()).toBe('main');
    expect(client.store.getState().auth.session.cryptoSuite).toEqual(suite);
};

// A transfer from the wallet page, to the founder
const transfer = (client: IClient, toID: string) => {
    const from = client.actions.length;
    client.dispatch(sendTransfer.started({
        transfer: { type: 'utxo', toID, amount: COIN },
        confirm: { title: 'Transfer', description: '1 coin' }
    }));
    return from;
};

const transferred = async (client: IClient, from: number) => {
    const result = await client.waitForAction(
        (action: Action): action is Action => sendTransfer.done.match(action) || sendTransfer.failed.match(action),
        'the transfer finished', from, 120000
    );
    expect(sendTransfer.failed.match(result) ? result.payload.error : null).toBeNull();
};

const SIGNED_OUT_ACTIONS: { [R in TSignOutReason]: string } = {
    E_CRYPTO_CHANGED: cryptoChanged.type,
    E_TOKENEXPIRED: sessionExpired.type
};

// On the sign-in page of the network, which says why; no dialog on the way but those the user opened
const expectSignedOut = async (client: IClient, from: number, reason: TSignOutReason, during: ISignOutReason['during'], userDialogs: string[] = []) => {
    await client.waitFor(state => !state.auth.isAuthenticated, 'signed out');
    const { network } = (await client.waitFor(state => !!state.engine.guestSession, 'the network connected to')).engine.guestSession;
    expect(client.store.getState().auth.signedOutBecause).toEqual({ reason, network: network.uuid, during });
    expect(client.screen()).toBe('auth');
    expect(actionsSince(client, from)).toContain(SIGNED_OUT_ACTIONS[reason]);
    expect(client.store.getState().auth.isAcquired).toBe(false);
    expect(modalsShown(client, from)).toEqual(userDialogs);
};

interface IProxy {
    url: string;
    server: Server;
    // Connections are dropped (the node cannot be reached) until restored
    cut(): void;
    restore(): void;
}

// An HTTP proxy in front of a node. `oldNode`: it answers /getuid like a node before the crypto
// settings existed, without cryptoer and hasher.
const startProxy = (target: string, { oldNode = false } = {}) => new Promise<IProxy>(resolve => {
    let cut = false;
    const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
        if (cut) {
            request.socket.destroy();
            return;
        }
        const chunks: Buffer[] = [];
        for await (const chunk of request) {
            chunks.push(chunk as Buffer);
        }
        const headers = Object.fromEntries(Object.entries(request.headers)
            .filter(([name]) => !['host', 'connection', 'content-length'].includes(name))
            .map(([name, value]) => [name, String(value)]));
        try {
            const upstream = await fetch(`${target}${request.url}`, {
                method: request.method,
                headers,
                body: chunks.length ? Buffer.concat(chunks) : undefined
            });
            let body = Buffer.from(await upstream.arrayBuffer());
            if (oldNode && request.url?.startsWith('/api/v2/getuid') && upstream.ok) {
                const { cryptoer, hasher, ...old } = JSON.parse(body.toString('utf8'));
                body = Buffer.from(JSON.stringify(old));
            }
            response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
            response.end(body);
        }
        catch {
            response.writeHead(502);
            response.end();
        }
    });
    server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as { port: number };
        resolve({
            url: `http://127.0.0.1:${port}`,
            server,
            cut: () => {
                cut = true;
                server.closeAllConnections();
            },
            restore: () => { cut = false; }
        });
    });
});

describe('session across crypto suite changes', () => {
    let centrifugo: ILocalCentrifugo;
    let network: ILocalNetwork;
    let deployed: ISettingsNetwork;
    const clients: IClient[] = [];
    const open = (settings: ISettings, persisted: TPersistedState | null = null) => {
        const client = startClient({ settings, persisted, answer, pkcs11: token?.pkcs11 ?? null });
        clients.push(client);
        return client;
    };
    // The app quits and starts again with what it stored
    const restart = (client: IClient, change?: (persisted: TPersistedState) => void) => {
        const persisted = client.persisted();
        client.close();
        change?.(persisted);
        return open(client.settings, persisted);
    };

    beforeAll(async () => {
        const chain = inject('chain');
        if (FIPS_MODULE) {
            token = await startSoftToken('ibax-e2e');
            userModuleKey = await token.generate(A, 'e2e user');
        }
        centrifugo = await startCentrifugo(chain.centrifugo, chain.root);
        network = await startNetwork({ root: chain.root, binary: chain.binary, postgres: chain.postgres, suite: A, networkID: NETWORK_ID, nodes: 2, centrifugo, name: 'session' });
        deployed = {
            key: 'E2E_NETWORK',
            name: 'e2e',
            networkID: NETWORK_ID,
            honorNodes: [network.nodes[0].apiHost],
            disableSync: true,
            socketUrl: centrifugo.socketUrl
        };
        await prepare(network);
    }, 300000);

    afterAll(async () => {
        clients.forEach(client => client.close());
        await network?.stop();
        await centrifugo?.stop();
        token?.close();
    });

    let client: IClient;
    // Every action of the client of a failed test, which the error alone does not tell
    beforeEach(() => onTestFailed(() => {
        if (client) {
            console.log(`client ${clients.indexOf(client)}: ${describeActions(client.actions)}`);
        }
    }));

    it('keeps a restored session while the node cannot be reached, and opens it once the node answers', async () => {
        const proxy = await startProxy(network.nodes[0].apiHost);
        try {
            const viaProxy: ISettingsNetwork = { ...deployed, key: 'E2E_VIA_PROXY', honorNodes: [proxy.url] };
            client = open(settingsFor(viaProxy));
            await signIn(client, A);

            proxy.cut();
            client = restart(client);
            await client.waitFor(state => 'E_OFFLINE' === state.auth.sessionRetryReason, 'the retry screen');
            expect(client.store.getState().auth.isAuthenticated).toBe(true);
            expect(client.screen()).toBe('retry');
            expect(modalsShown(client)).toEqual([]);

            proxy.restore();
            const back = Date.now();
            await client.waitFor(state => state.auth.isAcquired, 'the session acquired after the node is back', 2 * SESSION_RETRY_MS + 5000);
            expect(Date.now() - back).toBeLessThanOrEqual(2 * SESSION_RETRY_MS + 5000);
            expect(client.screen()).toBe('main');
            expect(client.store.getState().auth.sessionRetryReason).toBeNull();
        }
        finally {
            client.close();
            proxy.server.close();
        }
    });

    // go-ibax keeps the secret it signs tokens with in its keys directory
    it('keeps a restored session across a restart of the node, which still takes its token', async () => {
        client = open(settingsFor(deployed));
        await signIn(client, A);

        await network.stopNode(0);
        client = restart(client);
        await client.waitFor(state => 'E_OFFLINE' === state.auth.sessionRetryReason, 'the retry screen');
        await network.startNode(0);
        await client.waitFor(state => state.auth.isAcquired, 'the session acquired after the node is back', 2 * SESSION_RETRY_MS + 5000);
        expect(client.screen()).toBe('main');
        expect([client.store.getState().auth.sessionRetryReason, client.store.getState().auth.signedOutBecause]).toEqual([null, null]);
        expect(modalsShown(client)).toEqual([]);
        await transferred(client, transfer(client, network.nodes[0].keyID));
    });

    it('signs a restored session out as expired when the node lost its token secret meanwhile, without the error dialog', async () => {
        await network.stopNode(0);
        rmSync(path.join(network.nodes[0].dataDir, 'JWTSecret'));
        client = restart(client);
        await client.waitFor(state => 'E_OFFLINE' === state.auth.sessionRetryReason, 'the retry screen');
        await network.startNode(0);
        await expectSignedOut(client, 0, 'E_TOKENEXPIRED', 'session');
        expect(client.store.getState().auth.sessionRetryReason).toBeNull();
    });

    it('drops a session stored by 1.x (no suite) at restore, and finds the network\'s suite again', async () => {
        await signIn(client, A);
        client = restart(client, persisted => {
            delete (persisted.auth.session as { cryptoSuite?: unknown }).cryptoSuite;
            delete (persisted.engine.guestSession as { cryptoSuite?: unknown }).cryptoSuite;
        });
        // It cannot sign: the user signs in again, on a page with no notice (nothing was ended)
        await client.waitFor(state => sameSuite(state.engine.guestSession?.cryptoSuite, A), 'the network discovered again');
        const state = client.store.getState();
        expect([state.auth.isAuthenticated, state.auth.session, state.auth.signedOutBecause]).toEqual([false, null, null]);
        expect(client.screen()).toBe('auth');
        expect(actionsSince(client, 0)).not.toContain(acquireSession.started.type);
    });

    it('signs out on restart after the chain moved to SM2/SM3; signing in again uses the new address', async () => {
        await signIn(client, A);
        client.close();
        await network.redeploy(B);
        await prepare(network);

        client = restart(client);
        await expectSignedOut(client, 0, 'E_CRYPTO_CHANGED', 'session');
        await client.waitFor(state => sameSuite(state.engine.guestSession?.cryptoSuite, B), 'the network discovered under SM2/SM3');

        await signIn(client, B);
        expect(client.store.getState().auth.wallet.wallet.id).toBe(keyIDOf(B));
        await transferred(client, transfer(client, network.nodes[0].keyID));
    }, 300000);

    it('signs out when a transaction is refused because the chain changed its suite, without the error dialog', async () => {
        await network.redeploy(A);
        const from = transfer(client, network.nodes[0].keyID);
        await client.waitForAction(txExec.failed.match, 'the transaction refused', from, 120000)
            .then(failed => expect(failed.payload.error.type).toBe('E_CRYPTO_CHANGED'));
        // The transfer's own confirmation only
        await expectSignedOut(client, from, 'E_CRYPTO_CHANGED', 'send', ['CONFIRM']);
        expect(actionsSince(client, from)).toContain(logout.done.type);
    }, 300000);

    it('signs an idle session out when Centrifuge reconnects after the chain changed its suite', async () => {
        await prepare(network);
        await signIn(client, A);
        await client.waitFor(state => state.socket.connected, 'the socket connected');

        const from = client.actions.length;
        await network.redeploy(B);
        await centrifugo.restart();
        await client.waitForAction(reconnected.match, 'the socket reconnected', from);
        await expectSignedOut(client, from, 'E_CRYPTO_CHANGED', 'session');
    }, 300000);

    // A node checks at startup that its suite is the one its chain's genesis block was made with
    it('a peer alone switched to another suite refuses to start, the first node goes on', async () => {
        await prepare(network);
        const [first] = network.nodes;
        const api = new IbaxAPI({ apiHost: first.apiHost });
        const before = await maxBlockID(first.apiHost);

        await expect(network.startNode(1, { suite: A })).rejects.toThrow('the genesis block does not match the configured crypto suite');

        // Blocks keep coming from the first node, under the chain's suite
        const founder = await register(api, softwareKey(first.privateKey), NETWORK_ID);
        await execute(api.authorize(founder.result.token), await signTransaction(
            { ecosystemID: 1, networkID: NETWORK_ID, cryptoSuite: B },
            { type: 'utxo', toID: keyIDOf(B), value: '1', comment: '' },
            operatorSigner(first.privateKey, B)
        ));
        expect(await maxBlockID(first.apiHost)).toBeGreaterThan(before);
        expect((await api.getUid()).cryptoSuite).toEqual(B);

        await network.startNode(1, { suite: B });
    }, 300000);

    it('signs in and transfers on a node that does not report its suite (P256/SHA256)', async () => {
        const chain = inject('chain');
        const old = await startNetwork({ root: chain.root, binary: chain.binary, postgres: chain.postgres, suite: LEGACY_CRYPTO_SUITE, networkID: NETWORK_ID, nodes: 1, name: 'old_node' });
        const proxy = await startProxy(old.nodes[0].apiHost, { oldNode: true });
        try {
            const uid = await new IbaxAPI({ apiHost: proxy.url }).getUid();
            expect(uid.cryptoSuite).toEqual(LEGACY_CRYPTO_SUITE);
            await prepare(old);

            const onOld: ISettingsNetwork = { key: 'E2E_OLD', name: 'old', networkID: NETWORK_ID, honorNodes: [proxy.url], disableSync: true };
            client.close();
            client = open(settingsFor(onOld));
            await signIn(client, LEGACY_CRYPTO_SUITE);
            await transferred(client, transfer(client, old.nodes[0].keyID));
        }
        finally {
            client.close();
            proxy.server.close();
            await old.stop();
        }
    }, 300000);
});
