/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Signing out drops the session and its token (the node cannot revoke one: go-ibax has no such
// endpoint), from the state and from what is stored of it; and whatever asks the node for a
// signed-in user, reached after signing out, asks nothing and ends without an error shown.
import { Action } from 'redux';
import { describe, expect, it, vi } from 'vitest';
import { IRootState } from 'modules';
import mockState from 'test/mockStore';
import { runEpic } from 'test/runEpic';
import { selectPersistedState } from 'lib/persistence';
import { DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { E_SIGNED_OUT, login, logout } from './actions';
import reducer, { initialState } from './reducer';
import getPageTreeEpic from 'modules/editor/epics/getPageTreeEpic';
import loadEditorTabEpic from 'modules/editor/epics/loadEditorTabEpic';
import changeEditorToolEpic from 'modules/editor/epics/changeEditorToolEpic';
import newPageEpic from 'modules/editor/epics/newPageEpic';
import newBlockEpic from 'modules/editor/epics/newBlockEpic';
import newMenuEpic from 'modules/editor/epics/newMenuEpic';
import newContractEpic from 'modules/editor/epics/newContractEpic';
import debugContractEpic from 'modules/editor/epics/debugContractEpic';
import renderPageEpic from 'modules/sections/epics/renderPageEpic';
import fetchNotificationsEpic from 'modules/content/epics/fetchNotificationsEpic';
import fetchBalanceEpic from 'modules/wallet/epics/fetchBalanceEpic';
import { fetchHistoryEpic } from 'modules/wallet/epics/fetchHistoryEpic';
import { fetchUtxoHistoryEpic } from 'modules/wallet/epics/fetchUtxoHistoryEpic';
import sendTransferEpic from 'modules/wallet/epics/sendTransferEpic';
import { txExecEpic } from 'modules/tx/epics/txExecEpic';
import { txExecFailedEpic } from 'modules/tx/epics/txExecFailedEpic';
import { changeEditorTool, debugContract, editorSave, getPageTree, loadEditorTab } from 'modules/editor/actions';
import { renderPage } from 'modules/sections/actions';
import { fetchNotifications } from 'modules/content/actions';
import { fetchBalance, fetchHistory, fetchUtxoHistory, sendTransfer } from 'modules/wallet/actions';
import { txExec } from 'modules/tx/actions';

const session = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'jwt.secret.token', cryptoSuite: DEFAULT_CRYPTO_SUITE };
const owner = { account: '1188-4962-8957-7794-8872', ecosystem: '1' };

const wallet = { wallet: { id: '7', walletID: '7', address: owner.account, encKey: '', publicKey: '04', access: [] }, access: { ecosystem: '1', name: '', roles: [], notifications: [] } };
// Signed in with an account picked on the list, as the reducer leaves it; then signed out
const signedIn = reducer({ ...initialState, wallet }, login.done({ params: { password: 'p' }, result: { session, privateKey: 'k', publicKey: '04' } }));
const signedOutAuth = reducer(signedIn, logout.done({ params: null, result: null }));
const signedOut: IRootState = { ...mockState, auth: signedOutAuth };

describe('signing out', () => {
    it('keeps no session token, in the state or in what is stored', () => {
        // Positive control: signed in, the token is stored
        expect(JSON.stringify(selectPersistedState({ ...mockState, auth: signedIn }))).toContain(session.sessionToken);
        expect(signedOutAuth.session).toBeNull();
        expect(signedOutAuth.isAuthenticated).toBe(false);
        expect(JSON.stringify(signedOutAuth)).not.toContain(session.sessionToken);
        expect(JSON.stringify(selectPersistedState(signedOut))).not.toContain(session.sessionToken);
    });

    // Every epic that asks the node for a signed-in user, with what it answers once signed out
    const tab = { type: 'page', new: true, id: '1', name: 'x', value: '', uuid: 'u', tool: 'editor', initialValue: '', dirty: true } as never;
    const page = { section: 'home', name: 'home', params: {}, location: { pathname: '/', search: '', hash: '', state: null, key: '' } } as never;
    const history = { ...owner, filter: 'all', before: null } as never;
    const utxo = { ...owner, cursor: null };
    const transfer = { transfer: { type: 'utxo', toID: '5', amount: '1', comment: '' } } as never;
    const tx = { uuid: 'tx', contracts: [] };
    const cases: [string, typeof getPageTreeEpic, Action, Action[]][] = [
        ['getPageTree', getPageTreeEpic, getPageTree.started(undefined), [getPageTree.failed({ params: undefined, error: E_SIGNED_OUT })]],
        ['loadEditorTab', loadEditorTabEpic, loadEditorTab.started({ type: 'page', name: 'x' }), [loadEditorTab.failed({ params: { type: 'page', name: 'x' }, error: E_SIGNED_OUT })]],
        ['changeEditorTool', changeEditorToolEpic, changeEditorTool.started('preview'), [changeEditorTool.failed({ params: 'preview', error: E_SIGNED_OUT })]],
        ['newPage', newPageEpic, editorSave({ ...(tab as object), type: 'page' } as never), []],
        ['newBlock', newBlockEpic, editorSave({ ...(tab as object), type: 'block' } as never), []],
        ['newMenu', newMenuEpic, editorSave({ ...(tab as object), type: 'menu' } as never), []],
        ['newContract', newContractEpic, editorSave({ ...(tab as object), type: 'contract' } as never), []],
        ['debugContract', debugContractEpic, debugContract('x'), []],
        ['renderPage', renderPageEpic, renderPage.started(page), [renderPage.failed({ params: page, error: E_SIGNED_OUT })]],
        ['fetchNotifications', fetchNotificationsEpic, fetchNotifications.started(undefined), [fetchNotifications.failed({ params: undefined, error: undefined })]],
        ['fetchBalance', fetchBalanceEpic, fetchBalance.started(owner), [fetchBalance.failed({ params: owner, error: E_SIGNED_OUT })]],
        ['fetchHistory', fetchHistoryEpic, fetchHistory.started(history), [fetchHistory.failed({ params: history, error: E_SIGNED_OUT })]],
        ['fetchUtxoHistory', fetchUtxoHistoryEpic, fetchUtxoHistory.started(utxo), [fetchUtxoHistory.failed({ params: utxo, error: E_SIGNED_OUT })]],
        ['sendTransfer', sendTransferEpic, sendTransfer.started(transfer), [sendTransfer.failed({ params: transfer, error: { type: 'E_SIGNED_OUT', error: '' } })]],
        ['txExec', txExecEpic, txExec.started(tx), [txExec.failed({ params: tx, error: { type: 'E_SIGNED_OUT', error: '', params: [] } })]]
    ];

    it.each(cases)('leaves %s asking the node nothing for an action that comes after', async (_, epic, action, expected) => {
        const api = vi.fn(() => { throw new Error('the node was asked'); });
        const explorer = vi.fn(() => { throw new Error('the explorer was asked'); });
        expect(await runEpic(epic, [action], signedOut, { api, explorer } as never)).toEqual(expected);
        expect(api).not.toHaveBeenCalled();
        expect(explorer).not.toHaveBeenCalled();
    });

    it('shows no error for a transaction ended by signing out', async () => {
        expect(await runEpic(txExecFailedEpic, [txExec.failed({ params: { uuid: 'tx', contracts: [] }, error: { type: 'E_SIGNED_OUT', error: '', params: [] } })])).toEqual([]);
    });
});
