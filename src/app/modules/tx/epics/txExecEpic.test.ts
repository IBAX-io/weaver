/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { decode } from '@msgpack/msgpack';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import IbaxAPI from 'lib/ibaxAPI';
import { DEFAULT_CRYPTO_SUITE, resolveCryptoSuite } from 'lib/crypto/suites';
import { ITransactionBody, ITransactionCall } from 'ibax/tx';
import { ITxStatus } from 'ibax/api';
import { txExec } from '../actions';
import txExecEpic from './txExecEpic';

const PRIVATE_KEY = '1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727';
const RECIPIENT = '597920150864192934';

const state: IRootState = {
    ...mockState,
    auth: {
        ...mockState.auth,
        privateKey: PRIVATE_KEY,
        session: { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE }
    },
    storage: {
        ...mockState.storage,
        networks: [{ uuid: 'testnet', id: 5, name: 'Testnet', honorNodes: ['http://node'] }]
    }
};

// go-ibax converter.DecodeLength
const readLength = (data: Uint8Array, offset: number): [number, number] => {
    const first = data[offset];
    if (first < 128) {
        return [first, offset + 1];
    }
    let length = 0;
    for (let i = 1; i <= (first & 0x7F); i++) {
        length = length * 256 + data[offset + i];
    }
    return [length, offset + 1 + (first & 0x7F)];
};

const decodeClientTx = (data: Uint8Array) => {
    expect(data[0]).toBe(0x80);
    const [payloadLength, payloadStart] = readLength(data, 1);
    const payload = data.slice(payloadStart, payloadStart + payloadLength);
    const [signatureLength, signatureStart] = readLength(data, payloadStart + payloadLength);
    const signature = data.slice(signatureStart, signatureStart + signatureLength);
    return { payload, signature, body: decode(payload, { useBigInt64: true }) as ITransactionBody };
};

const createClient = (statuses: Array<{ [hash: string]: Partial<ITxStatus> } | 'sent'>) => {
    const client = new IbaxAPI({ apiHost: 'http://node' });
    const sent: { [hash: string]: Uint8Array }[] = [];
    vi.spyOn(client, 'txSend').mockImplementation(async (request: { [hash: string]: Blob }) => {
        const batch: { [hash: string]: Uint8Array } = {};
        for (const hash of Object.keys(request)) {
            batch[hash] = new Uint8Array(await request[hash].arrayBuffer());
        }
        sent.push(batch);
        return { hashes: {} };
    });
    vi.spyOn(client, 'txStatus').mockImplementation(async (hashes: string[]) => {
        const next = statuses.shift();
        const result: { [hash: string]: ITxStatus } = {};
        for (const hash of hashes) {
            result[hash] = { penalty: 0, blockid: '7', result: '', ...(next && next !== 'sent' ? next[hash] || next['*'] : {}) };
        }
        return result;
    });
    vi.spyOn(client, 'getContract').mockResolvedValue({
        id: 9, name: 'SetValue', active: true, tableid: 1, fields: [{ name: 'Value', type: 'string', optional: false }]
    });
    return { client, sent };
};

const call = (tx: Partial<ITransactionCall>): ITransactionCall => ({ uuid: 'tx-1', contracts: [], ...tx });

// Polling waits between requests; run the timers instead of waiting for them
const run = async (client: IbaxAPI, tx: ITransactionCall) => {
    const output = runEpic(txExecEpic, [txExec.started(tx)], state, { api: () => client });
    await vi.runAllTimersAsync();
    return output;
};

describe('txExecEpic', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('signs value transfers that verify with the account key', async () => {
        const { client, sent } = createClient([]);
        const output = await run(client, call({
            transfers: [
                { type: 'utxo', recipient: RECIPIENT, amount: '1500000000000', comment: 'rent' },
                { type: 'transferSelf', amount: '25', direction: 'toUTXO' }
            ]
        }));

        expect(output[0].type).toBe(txExec.done.type);
        const result = (output[0] as ReturnType<typeof txExec.done>).payload.result;
        expect(result.map(tx => tx.name)).toEqual(['UTXO', 'TransferSelf']);

        expect(sent).toHaveLength(1);
        const suite = resolveCryptoSuite(DEFAULT_CRYPTO_SUITE);
        const publicKey = suite.publicKey(PRIVATE_KEY);
        const decoded = Object.values(sent[0]).map(decodeClientTx);

        expect(decoded[0].body.UTXO).toEqual({ ToID: BigInt(RECIPIENT), Value: '1500000000000', Comment: 'rent' });
        expect(decoded[1].body.TransferSelf).toEqual({ Value: '25', Source: 'Account', Target: 'UTXO' });
        for (const tx of decoded) {
            expect(tx.body.Header.NetworkID).toBe(5);
            expect(tx.body.Header.KeyID).toBe(BigInt(suite.keyID(publicKey)));
            expect(suite.verify(suite.doubleHash(tx.payload), Array.from(tx.signature, b => b.toString(16).padStart(2, '0')).join(''), publicKey)).toBe(true);
        }
    });

    it('sends contracts first, then transfers, each as its own batch', async () => {
        const { client, sent } = createClient([]);
        const output = await run(client, call({
            contracts: [{ name: 'SetValue', params: [{ Value: 'a' }, { Value: 'b' }] }],
            transfers: [{ type: 'utxo', recipient: RECIPIENT, amount: '1', comment: '' }]
        }));

        expect(sent.map(batch => Object.values(batch).map(data => decodeClientTx(data).body.Header.ID))).toEqual([[9, 9], [0]]);
        expect((output[0] as ReturnType<typeof txExec.done>).payload.result.map(tx => tx.name)).toEqual(['SetValue', 'SetValue', 'UTXO']);
    });

    it('waits until the transfer is in a block', async () => {
        const { client } = createClient([{ '*': { blockid: '' } }, { '*': { blockid: '' } }]);
        const output = await run(client, call({ transfers: [{ type: 'transferSelf', amount: '5', direction: 'toAccount' }] }));

        expect(client.txStatus).toHaveBeenCalledTimes(3);
        expect(output[0].type).toBe(txExec.done.type);
    });

    it('never signs a transfer the node would reject', async () => {
        for (const transfer of [
            { type: 'utxo' as const, recipient: '597920150864192935', amount: '1', comment: '' },
            { type: 'utxo' as const, recipient: RECIPIENT, amount: '1.5', comment: '' },
            { type: 'transferSelf' as const, amount: '0', direction: 'toUTXO' as const }
        ]) {
            const { client, sent } = createClient([]);
            const output = await run(client, call({ transfers: [transfer] }));

            expect(sent).toHaveLength(0);
            expect(output).toEqual([txExec.failed({
                params: call({ transfers: [transfer] }),
                error: expect.objectContaining({ type: 'E_INVALID_TRANSFER' })
            })]);
        }
    });

    it('reports what the node says when a transfer fails', async () => {
        const { client } = createClient([{ '*': { blockid: '', errmsg: { type: 'error', error: 'Current balance is not enough' } } }]);
        const output = await run(client, call({ transfers: [{ type: 'utxo', recipient: RECIPIENT, amount: '1', comment: '' }] }));

        expect(output).toEqual([txExec.failed({
            params: call({ transfers: [{ type: 'utxo', recipient: RECIPIENT, amount: '1', comment: '' }] }),
            error: { id: undefined, type: 'error', error: 'Current balance is not enough' }
        })]);
    });
});
