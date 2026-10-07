/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { Action } from 'redux';
import { runEpic, runEpicLoop } from 'test/runEpic';
import mockState from 'test/mockStore';
import { IRootState } from 'modules';
import IbaxAPI from 'lib/ibaxAPI';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { IBalanceResponse, IKeyInfo } from 'ibax/api';
import { modalClose, modalShow } from 'modules/modal/actions';
import { txCall, txExec } from 'modules/tx/actions';
import { logout } from 'modules/auth/actions';
import { fetchBalance, ISendTransferCall, sendTransfer } from '../actions';
import reducer, { initialState } from '../reducer';
import fetchBalanceEpic from './fetchBalanceEpic';
import sendTransferEpic from './sendTransferEpic';

const OWNER = { account: '0624-2890-6001-1238-3609', ecosystem: '2' };
const BALANCE: IBalanceResponse = { amount: '1', utxo: '2', total: '3', digits: 12, token_symbol: 'ABC', token_name: 'Abc' };
const FEE: IBalanceResponse = { amount: '0', utxo: '9', total: '9', digits: 12, token_symbol: 'IBXC', token_name: 'IBAX Coin' };

const signedIn = (isDefaultWallet: boolean, ecosystem = OWNER.ecosystem): IRootState => ({
    ...mockState,
    auth: {
        ...mockState.auth,
        isDefaultWallet,
        session: { network: { uuid: 'testnet', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE },
        wallet: {
            wallet: { id: '1', walletID: '1', address: OWNER.account, encKey: '', publicKey: '', access: [] },
            access: { ecosystem, name: '', roles: [], notifications: [] }
        }
    }
});

const CALL: ISendTransferCall = {
    transfer: { type: 'utxo', toID: '597920150864192934', amount: '1' },
    confirm: { title: 'Send?', description: 'Really?' },
    unknownRecipientWarning: 'Nobody there.'
};

const clientWith = (keyInfo: IKeyInfo | Error, balances: { [ecosystem: string]: unknown } = {}) => {
    const client = new IbaxAPI({ apiHost: 'http://node' });
    vi.spyOn(client, 'keyinfo').mockImplementation(async () => {
        if (keyInfo instanceof Error) {
            throw keyInfo;
        }
        return keyInfo;
    });
    vi.spyOn(client, 'getBalance').mockImplementation(async ({ ecosystem }) => balances[String(ecosystem)] as IBalanceResponse);
    return client;
};

const types = (actions: Action[]) => actions.map(action => action.type);
const confirmWith = (reason: 'RESULT' | 'CANCEL') => (action: Action) =>
    modalShow.match(action) && 'WALLET_TRANSFER_CONFIRM' === action.payload.id ? [modalClose({ id: 'WALLET_TRANSFER_CONFIRM', reason, data: 'RESULT' === reason })] : [];

describe('sendTransferEpic', () => {
    it('refuses to send from the public demo key', async () => {
        const output = await runEpic(sendTransferEpic, [sendTransfer.started(CALL)], signedIn(true));
        expect(types(output)).toEqual([sendTransfer.failed.type, modalShow.type]);
    });

    it('sends nothing when the confirmation is cancelled', async () => {
        const client = clientWith({ account: 'x', ecosystems: [{ ecosystem: '1', name: '', roles: [], notifications: [] }] });
        const out = await runEpicLoop(sendTransferEpic, [sendTransfer.started(CALL)], { respond: confirmWith('CANCEL'), state: signedIn(false), dependencies: { api: () => client } });
        expect(types(out)).toEqual([sendTransfer.started.type, modalShow.type, modalClose.type, sendTransfer.failed.type]);
        expect(types(out)).not.toContain(txCall.type);
    });

    it('warns before sending to an address without an account', async () => {
        const client = clientWith({ account: '', ecosystems: [] });
        const out = await runEpicLoop(sendTransferEpic, [sendTransfer.started(CALL)], { respond: confirmWith('CANCEL'), state: signedIn(false), dependencies: { api: () => client } });
        const shown = out.find(action => modalShow.match(action)) as ReturnType<typeof modalShow>;
        expect(shown.payload.params.description).toBe('Really?\n\nNobody there.');
        expect(client.keyinfo).toHaveBeenCalledWith({ id: CALL.transfer.type === 'utxo' ? CALL.transfer.toID : '' });
    });

    it('does not warn when the account cannot be looked up', async () => {
        const client = clientWith(new Error('offline'));
        const out = await runEpicLoop(sendTransferEpic, [sendTransfer.started(CALL)], { respond: confirmWith('CANCEL'), state: signedIn(false), dependencies: { api: () => client } });
        const shown = out.find(action => modalShow.match(action)) as ReturnType<typeof modalShow>;
        expect(shown.payload.params.description).toBe('Really?');
    });

    it('confirms, sends the transfer and reloads the balance', async () => {
        const client = clientWith({ account: 'x', ecosystems: [{ ecosystem: '1', name: '', roles: [], notifications: [] }] });
        const respond = (action: Action) => txCall.match(action)
            ? [txExec.done({ params: action.payload, result: [{ name: 'UTXO', hash: 'ab12', body: null, status: null }] })]
            : confirmWith('RESULT')(action);
        const out = await runEpicLoop(sendTransferEpic, [sendTransfer.started(CALL)], { respond, state: signedIn(false), dependencies: { api: () => client } });

        const call = out.find(action => txCall.match(action)) as ReturnType<typeof txCall>;
        expect(call.payload.transfers).toEqual([CALL.transfer]);
        expect(call.payload.contracts).toEqual([]);
        expect(out).toContainEqual(sendTransfer.done({ params: CALL, result: { hash: 'ab12' } }));
        expect(out).toContainEqual(fetchBalance.started(OWNER));
    });

    // The transaction is confirmed only after the wallet open on screen changed hands
    const confirmedAfter = async (change: (auth: IRootState['auth']) => IRootState['auth'], outcome: 'done' | 'failed') => {
        const client = clientWith({ account: 'x', ecosystems: [{ ecosystem: '1', name: '', roles: [], notifications: [] }] });
        const state = signedIn(false);
        const respond = (action: Action) => {
            if (txCall.match(action)) {
                state.auth = change(state.auth);
                return ['done' === outcome
                    ? txExec.done({ params: action.payload, result: [{ name: 'UTXO', hash: 'ab12', body: null, status: null }] })
                    : txExec.failed({ params: action.payload, error: { type: 'E_ERROR', error: 'rejected' } })];
            }
            return confirmWith('RESULT')(action);
        };
        return runEpicLoop(sendTransferEpic, [sendTransfer.started(CALL)], { respond, state, dependencies: { api: () => client } });
    };
    const reported = (actions: Action[]) => types(actions).filter(type => [sendTransfer.done.type, sendTransfer.failed.type, fetchBalance.started.type].includes(type));

    it('reports the transfer to nobody once the user has signed out', async () => {
        // logout.done keeps the context and empties its wallet
        const signedOut = (auth: IRootState['auth']) => ({ ...auth, wallet: { ...auth.wallet, wallet: null }, isAuthenticated: false });
        expect(reported(await confirmedAfter(signedOut, 'done'))).toEqual([]);
        expect(reported(await confirmedAfter(signedOut, 'failed'))).toEqual([]);
    });

    it('does not show a transfer in the wallet of the account or ecosystem opened after it', async () => {
        const other = (auth: IRootState['auth']) => ({ ...auth, wallet: { ...auth.wallet, wallet: { ...auth.wallet.wallet, address: '0813-4574-2329-7730-4517' } } });
        const otherEcosystem = (auth: IRootState['auth']) => ({ ...auth, wallet: { ...auth.wallet, access: { ...auth.wallet.access, ecosystem: '5' } } });
        expect(reported(await confirmedAfter(other, 'done'))).toEqual([]);
        expect(reported(await confirmedAfter(otherEcosystem, 'failed'))).toEqual([]);
        // Positive control: the same run with the wallet unchanged reports both ways
        expect(reported(await confirmedAfter(auth => auth, 'done'))).toEqual([sendTransfer.done.type, fetchBalance.started.type]);
        expect(reported(await confirmedAfter(auth => auth, 'failed'))).toEqual([sendTransfer.failed.type]);
    });
});

describe('fetchBalanceEpic', () => {
    it('loads the balance and, outside ecosystem 1, the UTXO that pays the fees', async () => {
        const client = clientWith({ account: '', ecosystems: [] }, { 2: BALANCE, 1: FEE });
        const output = await runEpic(fetchBalanceEpic, [fetchBalance.started(OWNER)], signedIn(false), { api: () => client });

        expect(client.getBalance).toHaveBeenCalledWith({ wallet: OWNER.account, ecosystem: '2' });
        expect(client.getBalance).toHaveBeenCalledWith({ wallet: OWNER.account, ecosystem: '1' });
        expect(output).toEqual([fetchBalance.done({ params: OWNER, result: { value: BALANCE, fee: FEE } })]);
    });

    it('asks once in ecosystem 1', async () => {
        const owner = { ...OWNER, ecosystem: '1' };
        const client = clientWith({ account: '', ecosystems: [] }, { 1: FEE });
        const output = await runEpic(fetchBalanceEpic, [fetchBalance.started(owner)], signedIn(false, '1'), { api: () => client });
        expect(client.getBalance).toHaveBeenCalledTimes(1);
        expect(output).toEqual([fetchBalance.done({ params: owner, result: { value: FEE, fee: FEE } })]);
    });

    it('refuses a balance it cannot do arithmetic on', async () => {
        for (const broken of [{ ...BALANCE, utxo: '1.5' }, { ...BALANCE, digits: -1 }, { ...BALANCE, amount: 'lots' }, null]) {
            const client = clientWith({ account: '', ecosystems: [] }, { 2: broken, 1: FEE });
            const output = await runEpic(fetchBalanceEpic, [fetchBalance.started(OWNER)], signedIn(false), { api: () => client });
            expect(output).toEqual([fetchBalance.failed({ params: OWNER, error: 'E_INVALID_RESPONSE' })]);
        }
    });

    it('reports the node error', async () => {
        const client = new IbaxAPI({ apiHost: 'http://node' });
        vi.spyOn(client, 'getBalance').mockRejectedValue({ error: 'E_INVALIDWALLET' });
        const output = await runEpic(fetchBalanceEpic, [fetchBalance.started(OWNER)], signedIn(false), { api: () => client });
        expect(output).toEqual([fetchBalance.failed({ params: OWNER, error: 'E_INVALIDWALLET' })]);
    });

    it('drops the answer of a request made before signing out', async () => {
        const client = new IbaxAPI({ apiHost: 'http://node' });
        // The node answers only once the user has signed out
        let answer: (balance: IBalanceResponse) => void;
        vi.spyOn(client, 'getBalance').mockImplementation(() => new Promise(resolve => {
            answer = resolve;
        }));
        const respond = (action: Action) => {
            if (logout.started.match(action)) {
                answer(BALANCE);
            }
            return [];
        };
        const out = await runEpicLoop(fetchBalanceEpic, [fetchBalance.started(OWNER), logout.started(null)], { respond, state: signedIn(false), dependencies: { api: () => client } });
        expect(types(out)).toEqual([fetchBalance.started.type, logout.started.type]);
    });
});

describe('wallet reducer', () => {
    const loaded = reducer(initialState, fetchBalance.done({ params: OWNER, result: { value: BALANCE, fee: FEE } }));

    it('keeps the last balance of the same account when a refresh fails', () => {
        const failed = reducer(reducer(loaded, fetchBalance.started(OWNER)), fetchBalance.failed({ params: OWNER, error: 'E_OFFLINE' }));
        expect(failed.balance).toEqual(loaded.balance);
        expect(failed.balanceError).toBe('E_OFFLINE');
    });

    it('never keeps the balance of another account or ecosystem', () => {
        const other = { ...OWNER, ecosystem: '3' };
        expect(reducer(loaded, fetchBalance.started(other)).balance).toBeNull();
        expect(reducer(loaded, fetchBalance.failed({ params: other, error: 'E_OFFLINE' })).balance).toBeNull();
    });

    it('forgets the last transfer when the account or ecosystem changes', () => {
        // Its amount is shown with the balance's digits and token
        const done = reducer(loaded, sendTransfer.done({ params: CALL, result: { hash: 'ab' } }));
        expect(reducer(done, fetchBalance.started(OWNER)).lastTransfer).toEqual({ call: CALL, result: { hash: 'ab' } });
        expect(reducer(done, fetchBalance.started({ ...OWNER, ecosystem: '3' })).lastTransfer).toBeNull();
    });

    it('resets only the form of the kind of transfer that went through', () => {
        const done = reducer(reducer(loaded, sendTransfer.started(CALL)), sendTransfer.done({ params: CALL, result: { hash: 'ab' } }));
        expect(done.transfersDone).toEqual({ utxo: 1, transferSelf: 0 });
        expect(done.transferPending).toBeNull();
        expect(done.lastTransfer).toEqual({ call: CALL, result: { hash: 'ab' } });
        expect(reducer(done, logout.started(null))).toEqual(initialState);
    });
});
