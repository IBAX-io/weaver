/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// For every crypto suite a chain can run with: a local network of that suite, the client logging
// in, transferring and calling a contract with its own code, the node refusing what was signed for
// another suite or network, and a peer downloading and checking every block the first node signed.
// CHAIN_E2E_BLOCKS (default 10): blocks each network must reach. One suite: -t ECC_P256/SHA256.
// With CHAIN_E2E_FIPS (see localChain), the suites a FIPS node runs, in FIPS mode: the client signs
// with a key it generates in a SoftHSM token (see softToken), as only a module key signs there.
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import IbaxAPI from 'lib/ibaxAPI';
import { authenticate } from 'services/auth';
import { createSigner, FipsSignerRequiredError, ISigner, moduleKey, softwareKey, TSigningKey } from 'lib/crypto/signer';
import { ICryptoSuiteId } from 'ibax/crypto';
import { cryptoSuiteKey, resolveCryptoSuite } from 'lib/crypto/suites';
import { formatAddress } from 'lib/crypto/address';
import { ISignedTransaction, signTransaction, TTxPayload } from 'lib/tx/transaction';
import Contract from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import { ALL_SUITES, CONTRACT_PARAMS } from 'test/cryptovectors';
import { FIPS_MODULE, ILocalNetwork, nodeRuns, startNetwork } from './localChain';
import { execute, maxBlockID, operatorSigner, refusal, register, sleep } from './chainApi';
import { ISoftToken, startSoftToken } from './softToken';

const NETWORK_ID = 7;
const BLOCKS = Number(process.env.CHAIN_E2E_BLOCKS || 10);
// What a new module key gets from the founder, in base units: 1,000,000 coins
const USER_FUNDS = '1000000000000000000';
// What the founder moves to its account for contract fees: 100,000 coins
const FOUNDER_FEES = '100000000000000000';
// What the user moves to its account: another amount than FOUNDER_FEES, or in plain mode (the user
// is the founder) the two transactions are the same one when signed within the same second
const SELF_TRANSFER = '50000000000000000';

// Reports every parameter as the contract received it
const PARAMS_CONTRACT = `contract E2eParams {
    data {
${Object.entries(CONTRACT_PARAMS).map(([name, param]) => `        ${name} ${param.type}`).join('\n')}
    }
    action {
        $result = Sprintf("${Object.keys(CONTRACT_PARAMS).map(name => `${name}=%v`).join(' ')}", ${Object.keys(CONTRACT_PARAMS).map(name => `$${name}`).join(', ')})
    }
}`;

// What the contract VM holds after FillTxData: money in base units (12 digits), address as id
const PARAMS_RECEIVED = 'I1=42 I2=-9223372036854775808 I3=9223372036854775807 I4=7 F1=5 F2=2.5 F3=7 F4=-1000 ' +
    'M1=1500000000000 M2=1 S1=héllo B1=true A1=[a b] AD=597920150864192934 ' +
    'FL=map[Body:[104 105] MimeType:text/plain Name:a.txt]';

// Bytes of a suite's public key as the node checks it: the curves' keys without the 04 prefix
const nodeKeySize = (suite: ICryptoSuiteId, privateKey: string) => {
    const publicKey = resolveCryptoSuite(suite).publicKey(privateKey);
    return (130 === publicKey.length && publicKey.startsWith('04') ? 128 : publicKey.length) / 2;
};

// Other suites: another signature algorithm with keys of the same size and one with keys of
// another size (where there is one), and the same algorithm with another hash
const otherSuites = (suite: ICryptoSuiteId, privateKey: string): ICryptoSuiteId[] => {
    const size = nodeKeySize(suite, privateKey);
    const otherCryptoer = ALL_SUITES.filter(other => other.cryptoer !== suite.cryptoer && other.hasher === suite.hasher);
    return [
        otherCryptoer.find(other => nodeKeySize(other, privateKey) === size),
        otherCryptoer.find(other => nodeKeySize(other, privateKey) !== size),
        ALL_SUITES.find(other => other.cryptoer === suite.cryptoer && other.hasher !== suite.hasher)
    ].filter(Boolean);
};

// The node's answer to a signature by another suite's key: a key of its own size just does not
// verify, a key of another size is refused as no key of the network's algorithm
const refusalFor = (suite: ICryptoSuiteId, other: ICryptoSuiteId, privateKey: string) => {
    const size = nodeKeySize(other, privateKey);
    return size === nodeKeySize(suite, privateKey) ? 'Incorrect sign' : `invalid parameters len(public) = ${size}`;
};

describe.each(ALL_SUITES.filter(nodeRuns).map(suite => [cryptoSuiteKey(suite), suite] as const))('%s network', (_, suite) => {
    let network: ILocalNetwork;
    let api: IbaxAPI;
    // The user's session, and the founder's (the node operator's, which sets the network up)
    let client: IbaxAPI;
    let founderClient: IbaxAPI;
    let founderKey: string;
    let founder: ISigner;
    // The client's key: the founder's own key in memory, or in FIPS mode a key on the token
    let token: ISoftToken | null = null;
    let userKey: TSigningKey;
    let user: ISigner;
    const crypto = resolveCryptoSuite(suite);
    const context = { ecosystemID: 1, networkID: NETWORK_ID, cryptoSuite: suite };

    beforeAll(async () => {
        const { root, binary, postgres } = inject('chain');
        network = await startNetwork({ root, binary, postgres, suite, networkID: NETWORK_ID, nodes: 2 });
        api = new IbaxAPI({ apiHost: network.nodes[0].apiHost });
        founderKey = network.nodes[0].privateKey;
        founder = operatorSigner(founderKey, suite);
        founderClient = api.authorize((await register(api, softwareKey(founderKey), NETWORK_ID)).result.token);
        // Contract fees are paid from the account, not from UTXO: the founder's deploy needs them
        await execute(founderClient, await signTransaction(context, { type: 'transferSelf', value: FOUNDER_FEES, direction: 'toAccount' }, founder));

        if (FIPS_MODULE) {
            token = await startSoftToken('ibax-e2e');
            userKey = moduleKey(await token.generate(suite, `e2e ${cryptoSuiteKey(suite)}`));
            const { keyID } = await register(api, userKey, NETWORK_ID, token.pkcs11);
            await execute(founderClient, await signTransaction(context, { type: 'utxo', toID: keyID, value: USER_FUNDS, comment: '' }, founder));
        }
        else {
            userKey = softwareKey(founderKey);
        }
        user = createSigner(userKey, suite, { fips: null !== FIPS_MODULE, pkcs11: token?.pkcs11 ?? null });
    });

    afterAll(async () => {
        await network?.stop();
        token?.close();
    });

    it('every node reports the suite and network', async () => {
        for (const node of network.nodes) {
            const uid = await api.to(node.apiHost).getUid();
            expect(uid.cryptoSuite).toEqual(suite);
            expect(uid.networkID).toBe(NETWORK_ID);
            // The client does not read it: only what the node runs in
            const { fips } = await (await fetch(`${node.apiHost}/api/v2/getuid`)).json() as { fips: boolean };
            expect(fips).toBe(null !== FIPS_MODULE);
        }
    });

    it('logs the user in with the client\'s signature', async () => {
        const session = await authenticate(api, userKey, { networkID: NETWORK_ID, pkcs11: token?.pkcs11 });
        expect(session.cryptoSuite).toEqual(suite);
        expect(session.fips).toBe(null !== FIPS_MODULE);
        expect(session.keyID).toBe(user.keyID);
        expect(session.result.key_id).toBe(user.keyID);
        client = api.authorize(session.result.token);
    });

    it.runIf(FIPS_MODULE)('signs nothing with a key in memory on a FIPS network', async () => {
        await expect(authenticate(api, softwareKey(founderKey), { networkID: NETWORK_ID })).rejects.toBeInstanceOf(FipsSignerRequiredError);
    });

    it('refuses a login signed with another suite', async () => {
        for (const other of otherSuites(suite, founderKey)) {
            const uid = await api.getUid();
            const signer = resolveCryptoSuite(other);
            const error = await refusal(api.authorize(uid.token).login({
                publicKey: signer.publicKey(founderKey),
                signature: signer.sign(uid.uid, founderKey)
            }));
            expect([cryptoSuiteKey(other), error.msg]).toEqual([cryptoSuiteKey(other), refusalFor(suite, other, founderKey)]);
        }
    });

    it('moves coins from UTXO to the account (TransferSelf)', async () => {
        const before = await client.getBalance({ wallet: user.keyID, ecosystem: 1 });
        await execute(client, await signTransaction(context, { type: 'transferSelf', value: SELF_TRANSFER, direction: 'toAccount' }, user));
        const after = await client.getBalance({ wallet: user.keyID, ecosystem: 1 });
        expect(BigInt(after.amount) - BigInt(before.amount)).toBe(BigInt(SELF_TRANSFER));
    });

    it('transfers UTXO to a new account', async () => {
        const recipient = crypto.keyID(crypto.publicKey(randomBytes(32).toString('hex')));
        await execute(client, await signTransaction(context, { type: 'utxo', toID: recipient, value: '1500000000000', comment: 'Invoice #42 — ünïcode' }, user));
        const balance = await client.getBalance({ wallet: formatAddress(recipient), ecosystem: 1 });
        expect(balance.utxo).toBe('1500000000000');
    });

    it('deploys a contract and calls it with every parameter type', async () => {
        // The founder deploys it (creating contracts takes the developer's rights), the user calls it
        const newContract = await founderClient.getContract({ name: '@1NewContract' });
        await execute(founderClient, await new Contract({
            ...context,
            id: newContract.id,
            schema: defaultSchema,
            fields: {
                ApplicationId: { type: 'int', value: '1' },
                Value: { type: 'string', value: PARAMS_CONTRACT },
                Conditions: { type: 'string', value: 'true' }
            }
        }).sign(founder));

        const contract = await client.getContract({ name: '@1E2eParams' });
        const status = await execute(client, await new Contract({ ...context, id: contract.id, schema: defaultSchema, fields: CONTRACT_PARAMS }).sign(user));
        expect(status.result).toBe(PARAMS_RECEIVED);
    });

    it('refuses transactions signed for another suite or network', async () => {
        const payload: TTxPayload = { type: 'utxo', toID: network.nodes[0].keyID, value: '1', comment: '' };
        const send = (signed: ISignedTransaction) => refusal(founderClient.txSend({ [signed.hash]: new Blob([signed.data.slice()]) }));
        for (const other of otherSuites(suite, founderKey)) {
            const error = await send(await signTransaction({ ...context, cryptoSuite: other }, payload, operatorSigner(founderKey, other)));
            expect([cryptoSuiteKey(other), error.msg]).toEqual([cryptoSuiteKey(other), refusalFor(suite, other, founderKey)]);
        }
        expect((await send(await signTransaction({ ...context, networkID: NETWORK_ID + 1 }, payload, founder))).msg).toBe('error networkid invalid');
    });

    it(`reaches ${BLOCKS} blocks, and the peer checks and stores every one`, async () => {
        const [first, peer] = network.nodes;
        while (await maxBlockID(first.apiHost) < BLOCKS) {
            await execute(client, await signTransaction(context, { type: 'utxo', toID: first.keyID, value: '1', comment: '' }, user));
        }
        const height = await maxBlockID(first.apiHost);
        const deadline = Date.now() + 60000;
        while (await maxBlockID(peer.apiHost) < height && Date.now() < deadline) {
            await sleep(500);
        }
        expect(await maxBlockID(peer.apiHost)).toBeGreaterThanOrEqual(height);
    }, 600000);
});
