/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// The account's notifications pushed through Centrifugo: the signed-in client connects with its
// session's token, found at the node (config/centrifugo), and gets the counts of its own account;
// a token connects only while its session lasts, and to its own account's channel only. The cases
// build on each other, in order.
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it, onTestFailed, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { Centrifuge } from 'centrifuge';
import IbaxAPI from 'lib/ibaxAPI';
import { ICryptoSuiteId } from 'ibax/crypto';
import { IModuleKeyRef } from 'ibax/auth';
import { cryptoSuiteKey } from 'lib/crypto/suites';
import { formatAddress } from 'lib/crypto/address';
import { isValidPrivateKey } from 'lib/keyring';
import { createSigner, moduleKey, softwareKey, TSigningKey } from 'lib/crypto/signer';
import { signTransaction } from 'lib/tx/transaction';
import Contract from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import { addModuleWallet, importWallet, loadWallets, login, selectWallet } from 'modules/auth/actions';
import { reconnected } from 'modules/socket/actions';
import { FIPS_MODULE, ILocalCentrifugo, ILocalNetwork, startCentrifugo, startNetwork } from './localChain';
import { execute, operatorSigner, register, sleep } from './chainApi';
import { ISoftToken, startSoftToken, USER_PIN } from './softToken';
import { describeActions, IClient, startClient, TDialogAnswer } from './clientStore';
import { ISettingsNetwork, settingsFor } from './appConfig';

vi.mock('modules/engine/util/ConfigObservable', () => import('./appConfig'));

const NETWORK_ID = 7;
const SUITE: ICryptoSuiteId = FIPS_MODULE
    ? { cryptoer: 'ECC_P256', hasher: 'SHA3_256' }
    : { cryptoer: 'ECC_Secp256k1', hasher: 'KECCAK256' };
const PASSWORD = 'e2e-password';
const SECRET = FIPS_MODULE ? USER_PIN : PASSWORD;
// What the founder moves to its account for contract fees: 1,000 coins
const FOUNDER_FEES = '1000000000000000';

const newUserKey = (): string => {
    for (;;) {
        const key = randomBytes(32).toString('hex');
        if (isValidPrivateKey(key)) {
            return key;
        }
    }
};

const answer: TDialogAnswer = modal => 'AUTHORIZE' === modal.type ? { data: SECRET } : undefined;

interface IConnection {
    centrifuge: Centrifuge;
    // Resolves once connected, rejects with the code it was disconnected with first
    connected: Promise<void>;
}

// A connection of centrifuge-js itself with a token, as any client of Centrifugo could open it
const connectWith = (url: string, token: string): IConnection => {
    const centrifuge = new Centrifuge(`${url}/connection/websocket`, { token });
    const connected = new Promise<void>((resolve, reject) => {
        centrifuge.on('connected', () => resolve());
        centrifuge.on('disconnected', context => reject(context.code));
    });
    centrifuge.connect();
    return { centrifuge, connected };
};

describe('notifications through Centrifugo', () => {
    let centrifugo: ILocalCentrifugo;
    let network: ILocalNetwork;
    let api: IbaxAPI;
    let founderClient: IbaxAPI;
    let founderAddress: string;
    let notificationsSend: number;
    let token: ISoftToken | null = null;
    let userModuleKey: IModuleKeyRef | null = null;
    const userPrivateKey = newUserKey();
    let userKey: TSigningKey;
    let userAddress: string;
    let client: IClient;
    const connections: Centrifuge[] = [];
    const context = { ecosystemID: 1, networkID: NETWORK_ID, cryptoSuite: SUITE };

    // The founder notifies the user's account (MainCondition: the founder's rights)
    const notifyUser = async (header: string) => execute(founderClient, await new Contract({
        ...context,
        id: notificationsSend,
        schema: defaultSchema,
        fields: {
            Account: { type: 'string', value: userAddress },
            Header: { type: 'string', value: header }
        }
    }).sign(operatorSigner(network.nodes[0].privateKey, SUITE)));

    // The user's session opened directly (the user is registered), with its Centrifugo token
    const userLogin = async (expire?: number) => {
        const uid = await api.getUid();
        const signer = createSigner(userKey, SUITE, { fips: false, pkcs11: token?.pkcs11 ?? null });
        return api.authorize(uid.token).login({ publicKey: signer.publicKey, signature: await signer.sign(uid.uid), expire });
    };

    const count = (state: ReturnType<IClient['store']['getState']>) =>
        state.socket.notifications.find(n => n.id === state.auth.wallet?.wallet.id && '1' === n.ecosystem && '0' === n.role)?.count;

    beforeAll(async () => {
        const chain = inject('chain');
        centrifugo = await startCentrifugo(chain.centrifugo, chain.root);
        network = await startNetwork({ root: chain.root, binary: chain.binary, postgres: chain.postgres, suite: SUITE, networkID: NETWORK_ID, nodes: 1, centrifugo, name: 'notifications' });
        api = new IbaxAPI({ apiHost: network.nodes[0].apiHost });

        const founder = network.nodes[0];
        const founderSession = await register(api, softwareKey(founder.privateKey), NETWORK_ID);
        founderClient = api.authorize(founderSession.result.token);
        founderAddress = formatAddress(founderSession.keyID);
        await execute(founderClient, await signTransaction(context, { type: 'transferSelf', value: FOUNDER_FEES, direction: 'toAccount' }, operatorSigner(founder.privateKey, SUITE)));
        notificationsSend = Number((await founderClient.getContract({ name: '@1NotificationsSend' })).id);

        if (FIPS_MODULE) {
            token = await startSoftToken('ibax-e2e-notifications');
            userModuleKey = await token.generate(SUITE, 'e2e notifications');
            userKey = moduleKey(userModuleKey);
        }
        else {
            userKey = softwareKey(userPrivateKey);
        }
        const { keyID } = await register(api, userKey, NETWORK_ID, token?.pkcs11 ?? null);
        userAddress = formatAddress(keyID);
    }, 300000);

    afterAll(async () => {
        connections.forEach(centrifuge => centrifuge.disconnect());
        client?.close();
        await network?.stop();
        await centrifugo?.stop();
        token?.close();
    });

    beforeEach(() => onTestFailed(() => {
        if (client) {
            console.log(`client: ${describeActions(client.actions)}`);
        }
    }));

    it('connects once signed in, and shows the count pushed for the account', async () => {
        // No socketUrl: the client finds Centrifugo at the node
        const deployed: ISettingsNetwork = { key: 'E2E_NOTIFICATIONS', name: 'e2e', networkID: NETWORK_ID, honorNodes: [network.nodes[0].apiHost], disableSync: true };
        client = startClient({ settings: settingsFor(deployed), answer, pkcs11: token?.pkcs11 ?? null });
        await client.waitFor(state => !!state.engine.guestSession, 'the network discovered');
        // The guest has no notifications: it does not connect
        expect(client.store.getState().socket.socket).toBeNull();

        client.dispatch(userModuleKey
            ? addModuleWallet.started(userModuleKey)
            : importWallet.started({ backup: userPrivateKey, password: PASSWORD }));
        await client.waitFor(state => state.storage.wallets.length > 0, 'the imported wallet stored');
        const from = client.actions.length;
        client.dispatch(loadWallets.started(undefined));
        const loaded = await client.waitForAction(loadWallets.done.match, 'the accounts loaded', from);
        const account = loaded.payload.result.find(wallet => wallet.address === userAddress);
        expect(account, `the account ${userAddress} under ${cryptoSuiteKey(SUITE)}`).toBeDefined();
        client.dispatch(selectWallet({ wallet: account, access: account.access.find(ecosystem => '1' === ecosystem.ecosystem) }));
        client.dispatch(login.started({ password: SECRET }));
        await client.waitFor(state => state.auth.isAcquired, 'the session acquired');
        await client.waitFor(state => state.socket.connected, 'the socket connected');

        await notifyUser('first');
        await client.waitFor(state => 1 === count(state), 'the count of 1 pushed');
    });

    it('goes on receiving after Centrifugo comes back', async () => {
        const from = client.actions.length;
        await centrifugo.restart();
        await client.waitForAction(reconnected.match, 'the socket reconnected', from);

        await notifyUser('second');
        await client.waitFor(state => 2 === count(state), 'the count of 2 pushed');
    });

    it('takes no subscription of a token to another account\'s channel', async () => {
        const session = await userLogin();
        const { centrifuge, connected } = connectWith(centrifugo.socketUrl, session.notify_key);
        connections.push(centrifuge);
        await connected;

        const code = await new Promise<number>(resolve => {
            const subscription = centrifuge.newSubscription(`client#${founderAddress}`);
            subscription.on('error', context => resolve(context.error.code));
            subscription.on('unsubscribed', context => resolve(context.code));
            subscription.subscribe();
        });
        // Permission denied
        expect(code).toBe(103);
    });

    // A session of 1 second
    it('refuses the token of an expired session', async () => {
        const session = await userLogin(1);
        await sleep(2500);
        const { centrifuge, connected } = connectWith(centrifugo.socketUrl, session.notify_key);
        connections.push(centrifuge);
        await expect(connected).rejects.toEqual(expect.any(Number));
    });
});
