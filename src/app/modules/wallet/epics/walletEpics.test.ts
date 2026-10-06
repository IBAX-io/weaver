/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { Action } from 'redux';
import { Subject } from 'rxjs';
import { StateObservable } from 'redux-observable';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import storeDependencies from 'modules/dependencies';
import IbaxAPI from 'lib/ibaxAPI';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { modalClose, modalShow } from 'modules/modal/actions';
import { txCall, txExec } from 'modules/tx/actions';
import { fetchBalance, ISendTransferCall, sendTransfer } from '../actions';
import fetchBalanceEpic from './fetchBalanceEpic';
import sendTransferEpic from './sendTransferEpic';

const OWNER = { account: '0624-2890-6001-1238-3609', ecosystem: '2' };

const signedIn = (isDefaultWallet: boolean): IRootState => ({
    ...mockState,
    auth: {
        ...mockState.auth,
        isDefaultWallet,
        session: { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE },
        wallet: {
            wallet: { id: '1', walletID: '1', address: OWNER.account, encKey: '', publicKey: '', access: [] },
            access: { ecosystem: OWNER.ecosystem, name: '', roles: [], notifications: [] }
        }
    }
});

const CALL: ISendTransferCall = {
    transfer: { type: 'utxo', recipient: '597920150864192934', amount: '1', comment: '' },
    confirm: { title: 'Send?', description: 'Really?' }
};

// Drives an epic with a live action stream, so it can react to the actions it is waiting for
const drive = (epic: typeof sendTransferEpic, state: IRootState, script: (emitted: Action[], input: Subject<Action>) => void) => {
    const input = new Subject<Action>();
    const emitted: Action[] = [];
    epic(input, new StateObservable<IRootState>(new Subject<IRootState>(), state), storeDependencies).subscribe(action => {
        emitted.push(action);
        script(emitted, input);
    });
    return { input, emitted };
};

describe('sendTransferEpic', () => {
    it('refuses to send from the public demo key', async () => {
        const output = await runEpic(sendTransferEpic, [sendTransfer.started(CALL)], signedIn(true));

        expect(output.map(a => a.type)).toEqual([sendTransfer.failed.type, modalShow.type]);
        expect(output.some(a => a.type === txCall.type)).toBe(false);
    });

    it('sends nothing when the confirmation is cancelled', async () => {
        const { input, emitted } = drive(sendTransferEpic, signedIn(false), (out, actions) => {
            const last = out[out.length - 1];
            if (last.type === modalShow.type) {
                actions.next(modalClose({ reason: 'CANCEL', data: null }));
                actions.complete();
            }
        });
        input.next(sendTransfer.started(CALL));
        await Promise.resolve();

        expect(emitted.map(a => a.type)).toEqual([modalShow.type, sendTransfer.failed.type]);
        expect(emitted[1]).toEqual(sendTransfer.failed({ params: CALL, error: null }));
    });

    it('confirms, sends the transfer and reloads the balance', async () => {
        const { input, emitted } = drive(sendTransferEpic, signedIn(false), (out, actions) => {
            const last = out[out.length - 1];
            if (last.type === modalShow.type) {
                actions.next(modalClose({ reason: 'RESULT', data: true }));
            }
            if (txCall.match(last)) {
                actions.next(txExec.done({ params: last.payload, result: [] }));
                actions.complete();
            }
        });
        input.next(sendTransfer.started(CALL));
        await Promise.resolve();

        expect(emitted.map(a => a.type)).toEqual([modalShow.type, txCall.type, sendTransfer.done.type, fetchBalance.started.type]);
        const call = emitted[1] as ReturnType<typeof txCall>;
        expect(call.payload.transfers).toEqual([CALL.transfer]);
        expect(call.payload.contracts).toEqual([]);
        expect(emitted[3]).toEqual(fetchBalance.started(OWNER));
    });
});

describe('fetchBalanceEpic', () => {
    it('asks the node for the balance of the account in the ecosystem', async () => {
        const client = new IbaxAPI({ apiHost: 'http://node' });
        const balance = { amount: '1', utxo: '2', total: '3', digits: 12, token_symbol: 'IBXC', token_name: 'IBAX Coin' };
        const getBalance = vi.spyOn(client, 'getBalance').mockResolvedValue(balance);

        const output = await runEpic(fetchBalanceEpic, [fetchBalance.started(OWNER)], signedIn(false), { api: () => client });

        expect(getBalance).toHaveBeenCalledWith({ wallet: OWNER.account, ecosystem: OWNER.ecosystem });
        expect(output).toEqual([fetchBalance.done({ params: OWNER, result: balance })]);
    });

    it('reports the node error', async () => {
        const client = new IbaxAPI({ apiHost: 'http://node' });
        vi.spyOn(client, 'getBalance').mockRejectedValue({ error: 'E_INVALIDWALLET' });

        const output = await runEpic(fetchBalanceEpic, [fetchBalance.started(OWNER)], signedIn(false), { api: () => client });

        expect(output).toEqual([fetchBalance.failed({ params: OWNER, error: 'E_INVALIDWALLET' })]);
    });
});
