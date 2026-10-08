/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// For every crypto suite a chain can run with: a local network of that suite, the client logging
// in, transferring and calling a contract with its own code, the node refusing what was signed for
// another suite or network, and a peer downloading and checking every block the first node signed.
// CHAIN_E2E_BLOCKS (default 10): blocks each network must reach. One suite: -t ECC_P256/SHA256
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import IbaxAPI from 'lib/ibaxAPI';
import { authenticate } from 'services/auth';
import { ICryptoSuiteId } from 'ibax/crypto';
import { cryptoSuiteKey, resolveCryptoSuite } from 'lib/crypto/suites';
import { formatAddress } from 'lib/crypto/address';
import { ISignedTransaction, signTransaction, TTxPayload } from 'lib/tx/transaction';
import Contract from 'lib/tx/contract';
import defaultSchema from 'lib/tx/schema/defaultSchema';
import { ALL_SUITES, CONTRACT_PARAMS } from 'test/cryptovectors';
import { ILocalNetwork, startNetwork } from './localChain';
import { execute, maxBlockID, refusal, sleep } from './chainApi';

const NETWORK_ID = 7;
const BLOCKS = Number(process.env.CHAIN_E2E_BLOCKS || 10);

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

describe.each(ALL_SUITES.map(suite => [cryptoSuiteKey(suite), suite] as const))('%s network', (_, suite) => {
    let network: ILocalNetwork;
    let api: IbaxAPI;
    let client: IbaxAPI;
    let founderKey: string;
    const crypto = resolveCryptoSuite(suite);
    const context = { ecosystemID: 1, networkID: NETWORK_ID, cryptoSuite: suite };

    beforeAll(async () => {
        const { root, binary, postgres } = inject('chain');
        network = await startNetwork({ root, binary, postgres, suite, networkID: NETWORK_ID, nodes: 2 });
        api = new IbaxAPI({ apiHost: network.nodes[0].apiHost });
        founderKey = network.nodes[0].privateKey;
    });

    afterAll(async () => {
        await network?.stop();
    });

    it('every node reports the suite and network', async () => {
        for (const node of network.nodes) {
            const uid = await api.to(node.apiHost).getUid();
            expect(uid.cryptoSuite).toEqual(suite);
            expect(uid.networkID).toBe(NETWORK_ID);
        }
    });

    it('logs the founder in with the client\'s signature', async () => {
        const session = await authenticate(api, founderKey, { networkID: NETWORK_ID });
        expect(session.cryptoSuite).toEqual(suite);
        expect(session.keyID).toBe(network.nodes[0].keyID);
        expect(session.result.key_id).toBe(network.nodes[0].keyID);
        client = api.authorize(session.result.token);
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
        const before = await client.getBalance({ wallet: network.nodes[0].keyID, ecosystem: 1 });
        await execute(client, signTransaction(context, { type: 'transferSelf', value: '100000000000000000', direction: 'toAccount' }, founderKey));
        const after = await client.getBalance({ wallet: network.nodes[0].keyID, ecosystem: 1 });
        expect(BigInt(after.amount) - BigInt(before.amount)).toBe(100000000000000000n);
    });

    it('transfers UTXO to a new account', async () => {
        const recipient = crypto.keyID(crypto.publicKey(randomBytes(32).toString('hex')));
        await execute(client, signTransaction(context, { type: 'utxo', toID: recipient, value: '1500000000000', comment: 'Invoice #42 — ünïcode' }, founderKey));
        const balance = await client.getBalance({ wallet: formatAddress(recipient), ecosystem: 1 });
        expect(balance.utxo).toBe('1500000000000');
    });

    it('deploys a contract and calls it with every parameter type', async () => {
        const newContract = await client.getContract({ name: '@1NewContract' });
        await execute(client, new Contract({
            ...context,
            id: newContract.id,
            schema: defaultSchema,
            fields: {
                ApplicationId: { type: 'int', value: '1' },
                Value: { type: 'string', value: PARAMS_CONTRACT },
                Conditions: { type: 'string', value: 'true' }
            }
        }).sign(founderKey));

        const contract = await client.getContract({ name: '@1E2eParams' });
        const status = await execute(client, new Contract({ ...context, id: contract.id, schema: defaultSchema, fields: CONTRACT_PARAMS }).sign(founderKey));
        expect(status.result).toBe(PARAMS_RECEIVED);
    });

    it('refuses transactions signed for another suite or network', async () => {
        const payload: TTxPayload = { type: 'utxo', toID: network.nodes[0].keyID, value: '1', comment: '' };
        const send = (signed: ISignedTransaction) => refusal(client.txSend({ [signed.hash]: new Blob([signed.data.slice()]) }));
        for (const other of otherSuites(suite, founderKey)) {
            const error = await send(signTransaction({ ...context, cryptoSuite: other }, payload, founderKey));
            expect([cryptoSuiteKey(other), error.msg]).toEqual([cryptoSuiteKey(other), refusalFor(suite, other, founderKey)]);
        }
        expect((await send(signTransaction({ ...context, networkID: NETWORK_ID + 1 }, payload, founderKey))).msg).toBe('error networkid invalid');
    });

    it(`reaches ${BLOCKS} blocks, and the peer checks and stores every one`, async () => {
        const [first, peer] = network.nodes;
        while (await maxBlockID(first.apiHost) < BLOCKS) {
            await execute(client, signTransaction(context, { type: 'utxo', toID: first.keyID, value: '1', comment: '' }, founderKey));
        }
        const height = await maxBlockID(first.apiHost);
        const deadline = Date.now() + 60000;
        while (await maxBlockID(peer.apiHost) < height && Date.now() < deadline) {
            await sleep(500);
        }
        expect(await maxBlockID(peer.apiHost)).toBeGreaterThanOrEqual(height);
    }, 600000);
});
