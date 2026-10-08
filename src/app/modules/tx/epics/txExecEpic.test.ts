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
import { cryptoSuiteFromNode, DEFAULT_CRYPTO_SUITE, ICryptoSuiteId, resolveCryptoSuite } from 'lib/crypto/suites';
import { ITransactionBody, ITransactionCall } from 'ibax/tx';
import { IContractResponse, ITxStatus } from 'ibax/api';
import { IAPIError, isApiError } from 'lib/ibaxAPI/errors';
import { cryptoChanged, E_CRYPTO_CHANGED, logout } from 'modules/auth/actions';
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

const createClient = (
    statuses: Array<{ [hash: string]: Partial<ITxStatus> } | IAPIError>,
    fields: IContractResponse['fields'] = [{ name: 'Value', type: 'string', optional: false }]
) => {
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
        if (isApiError(next)) {
            throw next;
        }
        const result: { [hash: string]: ITxStatus } = {};
        for (const hash of hashes) {
            const override = next ? (hash in next ? next[hash] : next['*']) : {};
            // null: the node returned no entry for this hash
            if (override !== null) {
                result[hash] = { penalty: 0, blockid: '7', result: '', ...override };
            }
        }
        return result;
    });
    vi.spyOn(client, 'getContract').mockResolvedValue({ id: 9, name: 'SetValue', active: true, tableid: 1, fields });
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
                { type: 'utxo', toID: RECIPIENT, amount: '1500000000000' },
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

        // The node ignores the comment of a UTXO transfer, so none is sent
        expect(decoded[0].body.UTXO).toEqual({ ToID: BigInt(RECIPIENT), Value: '1500000000000', Comment: '' });
        expect(decoded[1].body.TransferSelf).toEqual({ Value: '25', Source: 'Account', Target: 'UTXO' });
        for (const tx of decoded) {
            expect(tx.body.Header.NetworkID).toBe(5n);
            expect(tx.body.Header.KeyID).toBe(BigInt(suite.keyID(publicKey)));
            expect(suite.verify(suite.doubleHash(tx.payload), Array.from(tx.signature, b => b.toString(16).padStart(2, '0')).join(''), publicKey)).toBe(true);
        }
    });

    it('sends contracts first, then transfers, each as its own batch', async () => {
        const { client, sent } = createClient([]);
        const output = await run(client, call({
            contracts: [{ name: 'SetValue', params: [{ Value: 'a' }, { Value: 'b' }] }],
            transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '1' }]
        }));

        expect(sent.map(batch => Object.values(batch).map(data => decodeClientTx(data).body.Header.ID))).toEqual([[9n, 9n], [0n]]);
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
            { type: 'utxo' as const, toID: '597920150864192935', amount: '1' },
            { type: 'utxo' as const, toID: RECIPIENT, amount: '1.5' },
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
        const output = await run(client, call({ transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '1' }] }));

        expect(output).toEqual([txExec.failed({
            params: call({ transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '1' }] }),
            error: { id: undefined, type: 'error', error: 'Current balance is not enough' }
        })]);
    });

    it('names the node\'s insufficient balance error so it can be translated', async () => {
        const error = 'account 0624-2890-6001-1238-3609 current balance is not enough in ecosystem 1';
        const { client } = createClient([{ '*': { blockid: '', errmsg: { type: 'error', error } } }]);
        const output = await run(client, call({ transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '1' }] }));

        expect((output[0] as ReturnType<typeof txExec.failed>).payload.error).toEqual({
            id: undefined, type: 'E_INSUFFICIENT_BALANCE', error, params: ['0624-2890-6001-1238-3609', '1']
        });
    });

    it('keeps waiting while the node does not know the hash yet', async () => {
        const { client } = createClient([{ error: 'E_HASHNOTFOUND', msg: 'Hash has not been found' }, { '*': null }]);
        const output = await run(client, call({ transfers: [{ type: 'transferSelf', amount: '5', direction: 'toAccount' }] }));

        expect(client.txStatus).toHaveBeenCalledTimes(3);
        expect(output[0].type).toBe(txExec.done.type);
    });

    it('stops waiting after a while', async () => {
        const { client } = createClient(Array.from({ length: 200 }, () => ({ '*': { blockid: '' } })));
        const output = await run(client, call({ transfers: [{ type: 'transferSelf', amount: '5', direction: 'toAccount' }] }));

        expect((output[0] as ReturnType<typeof txExec.failed>).payload.error).toEqual(expect.objectContaining({ type: 'E_TX_TIMEOUT', params: ['3'] }));
        expect(client.txStatus).toHaveBeenCalledTimes(90);
    });

    it('fails a transaction the block penalized', async () => {
        const { client } = createClient([{ '*': { blockid: '9', penalty: 1, result: 'out of fuel' } }]);
        const output = await run(client, call({ transfers: [{ type: 'transferSelf', amount: '5', direction: 'toAccount' }] }));

        expect((output[0] as ReturnType<typeof txExec.failed>).payload.error).toEqual({ type: 'E_PENALTY', error: 'out of fuel', params: ['TransferSelf'] });
    });

    it('refuses to send the same transaction twice in one batch', async () => {
        const { client, sent } = createClient([]);
        const transfer = { type: 'transferSelf' as const, amount: '5', direction: 'toAccount' as const };
        const output = await run(client, call({ transfers: [transfer, transfer] }));

        expect(sent).toHaveLength(0);
        expect((output[0] as ReturnType<typeof txExec.failed>).payload.error.type).toBe('E_DUPLICATE_TX');
    });

    it('sends nothing when one transfer of a call is invalid', async () => {
        const { client, sent } = createClient([]);
        const output = await run(client, call({
            contracts: [{ name: 'SetValue', params: [{ Value: 'a' }] }],
            transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '0' }]
        }));

        expect(sent).toHaveLength(0);
        expect((output[0] as ReturnType<typeof txExec.failed>).payload.error).toEqual({ type: 'E_INVALID_TRANSFER', error: 'amount', params: ['amount'] });
    });

    it('names the contract parameter that cannot be sent', async () => {
        const invalid = createClient([], [{ name: 'Count', type: 'int', optional: false }]);
        const invalidOut = await run(invalid.client, call({ contracts: [{ name: 'SetValue', params: [{ Count: '1.5' }] }] }));
        expect((invalidOut[0] as ReturnType<typeof txExec.failed>).payload.error).toEqual({ type: 'E_INVALID_PARAM', error: 'Count', params: ['Count', 'int'] });

        const unsupported = createClient([], [{ name: 'Blob', type: 'bytes' as IContractResponse['fields'][number]['type'], optional: false }]);
        const unsupportedOut = await run(unsupported.client, call({ contracts: [{ name: 'SetValue', params: [{ Blob: 'aa' }] }] }));
        expect((unsupportedOut[0] as ReturnType<typeof txExec.failed>).payload.error.type).toBe('E_UNSUPPORTED_PARAM');
        expect(invalid.sent).toHaveLength(0);
    });

    it('sends nothing when a later contract of the call cannot be signed', async () => {
        const { client, sent } = createClient([], [{ name: 'Count', type: 'int', optional: false }]);
        const output = await run(client, call({
            contracts: [{ name: 'First', params: [{ Count: '1' }] }, { name: 'Second', params: [{ Count: '1.5' }] }]
        }));

        // Signing the second contract fails: the first must not have gone out already
        expect(sent).toHaveLength(0);
        expect((output[0] as ReturnType<typeof txExec.failed>).payload.error.type).toBe('E_INVALID_PARAM');
    });

    it('keeps waiting for a sent transaction while the node cannot be reached', async () => {
        const { client } = createClient([{ error: 'E_OFFLINE' }, { error: 'E_OFFLINE' }]);
        const output = await run(client, call({ transfers: [{ type: 'transferSelf', amount: '5', direction: 'toAccount' }] }));

        expect(client.txStatus).toHaveBeenCalledTimes(3);
        expect(output[0].type).toBe(txExec.done.type);
    });

    it('ends in failed, not silence, when the session\'s network is gone', async () => {
        const { client, sent } = createClient([]);
        const output = await runEpic(txExecEpic, [txExec.started(call({ transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '1' }] }))],
            { ...state, storage: { ...state.storage, networks: [] } }, { api: () => client });

        expect(sent).toHaveLength(0);
        expect(output.map(action => action.type)).toEqual([txExec.failed.type]);
    });

    describe('when the node refuses the signatures', () => {
        // go-ibax answers a transaction signed with another suite's algorithms like this, at once
        const INCORRECT_SIGN: IAPIError = { error: 'E_SERVER', msg: 'Incorrect sign' } as IAPIError;
        const TRANSFER = call({ transfers: [{ type: 'utxo', toID: RECIPIENT, amount: '1' }] });
        // The call fails; the session it was signed in (still open) ends, the reason kept for the
        // testnet's sign-in page
        const SIGNED_OUT = [
            txExec.failed({ params: TRANSFER, error: { type: E_CRYPTO_CHANGED, error: '', params: [] } }),
            cryptoChanged({ reason: E_CRYPTO_CHANGED, network: 'testnet', during: 'send' }),
            logout.started(null)
        ];

        // The node refuses the send; /getuid reports `suite`, or fails when null
        const refusingNode = (suite: ICryptoSuiteId | null) => {
            const { client } = createClient([]);
            vi.mocked(client.txSend).mockRejectedValue(INCORRECT_SIGN);
            const getUid = vi.spyOn(client, 'getUid').mockImplementation(async () => {
                if (!suite) {
                    throw { error: 'E_OFFLINE', msg: '' };
                }
                return { token: '', networkID: 5, uid: 'LOGIN51', cryptoSuite: cryptoSuiteFromNode(suite.cryptoer, suite.hasher) };
            });
            return { client, getUid };
        };

        it('signs out and says why when the network now uses other key algorithms', async () => {
            const { client } = refusingNode({ cryptoer: 'SM2', hasher: 'SM3' });
            const output = await run(client, TRANSFER);
            expect(output).toEqual(SIGNED_OUT);
            // Nothing was waited for
            expect(client.txStatus).not.toHaveBeenCalled();
        });

        it('tells a change of the hash alone too', async () => {
            const { client } = refusingNode({ cryptoer: 'ECC_Secp256k1', hasher: 'SHA256' });
            const output = await run(client, TRANSFER);
            expect(output).toEqual(SIGNED_OUT);
        });

        it('reports the refusal as it is when the algorithms did not change, or the node cannot say', async () => {
            for (const suite of [DEFAULT_CRYPTO_SUITE, null]) {
                const { client, getUid } = refusingNode(suite);
                const output = await run(client, TRANSFER);
                expect(output).toEqual([txExec.failed({ params: TRANSFER, error: { type: 'E_SERVER', error: 'Incorrect sign', params: [] } })]);
                expect(getUid).toHaveBeenCalledTimes(1);
            }
        });

        it('asks nothing when the node could not be reached', async () => {
            const { client, getUid } = refusingNode({ cryptoer: 'SM2', hasher: 'SM3' });
            vi.mocked(client.txSend).mockRejectedValue({ error: 'E_OFFLINE', msg: '' });
            const output = await run(client, TRANSFER);
            expect(output).toEqual([txExec.failed({ params: TRANSFER, error: { type: 'E_OFFLINE', error: '', params: [] } })]);
            expect(getUid).not.toHaveBeenCalled();
        });

        it('asks nothing more when the node takes the transactions', async () => {
            const { client } = createClient([{}]);
            const getUid = vi.spyOn(client, 'getUid');
            const output = await run(client, TRANSFER);
            expect(output.map(action => action.type)).toEqual([txExec.done.type, expect.any(String)]);
            expect(getUid).not.toHaveBeenCalled();
        });
    });
});
