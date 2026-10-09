/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi } from 'vitest';
import { ISession } from 'ibax/auth';
import { IRootState } from 'modules';
import { runEpic } from 'test/runEpic';
import mockState from 'test/mockStore';
import { cryptoSuiteFromNode, DEFAULT_CRYPTO_SUITE, ICryptoSuiteId } from 'lib/crypto/suites';
import { modalShow } from 'modules/modal/actions';
import { sectionsInit } from 'modules/sections/actions';
import IbaxAPI from 'lib/ibaxAPI';
import { acquireSession, cryptoChanged, E_CRYPTO_CHANGED, E_TOKENEXPIRED, login, loginGuest, logout, sessionExpired } from '../actions';
import reducer, { initialState } from '../reducer';
import acquireSessionEpic from './acquireSessionEpic';
import { softwareKey } from 'lib/crypto/signer';

const session: ISession = { network: { uuid: 'net', apiHost: 'http://node' }, sessionToken: 'token', cryptoSuite: DEFAULT_CRYPTO_SUITE };
// The session being acquired is the one open
const signedIn = (open: ISession | null = session, isAuthenticated = true): IRootState => ({ ...mockState, auth: { ...mockState.auth, isAuthenticated, session: open } });
const changed = cryptoChanged({ reason: E_CRYPTO_CHANGED, network: 'net', during: 'session' });

// The node: the suite its /getuid reports now (or the error it fails with), and one section
const nodeReporting = (suite: ICryptoSuiteId | { error: unknown }) => {
    const client = {
        // As the client reads /getuid (lib/ibaxAPI): the suite from cryptoer and hasher
        getUid: vi.fn(async () => {
            if ('error' in suite) {
                throw suite.error;
            }
            return { token: '', networkID: 1, uid: 'LOGIN11', cryptoSuite: cryptoSuiteFromNode(suite.cryptoer, suite.hasher) };
        }),
        sections: vi.fn(async () => ({ list: [{ urlname: 'home', title: 'Home', page: 'default_page', status: '2' }] })),
        getParam: vi.fn(async () => ({ value: '' }))
    };
    return { client, api: (() => client) as unknown as (params: unknown) => IbaxAPI };
};

describe('acquireSessionEpic', () => {
    it('restores a session whose key algorithms the network still uses', async () => {
        const { client, api } = nodeReporting(DEFAULT_CRYPTO_SUITE);
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
        expect(out.map(action => action.type)).toContain(sectionsInit.type);
        expect(out).toContainEqual(acquireSession.done({ params: session, result: true }));
        // Asked alongside the sections, once
        expect(client.getUid).toHaveBeenCalledTimes(1);
    });

    it('ends a session signed in under algorithms the network no longer uses, and says why', async () => {
        // The chain's settings changed from secp256k1/Keccak-256 to SM2/SM3 since the user signed in
        const { api } = nodeReporting({ cryptoer: 'SM2', hasher: 'SM3' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
        // Signed out, the reason kept for the sign-in page: no modal, which the sign-out would close
        expect(out).toEqual([
            acquireSession.failed({ params: session, error: E_CRYPTO_CHANGED }),
            changed,
            logout.started(null)
        ]);
        expect(out.some(action => modalShow.match(action) || sectionsInit.match(action))).toBe(false);
    });

    it('tells a change of the hash alone too, and a session stored without its algorithms', async () => {
        const { api } = nodeReporting({ cryptoer: 'ECC_Secp256k1', hasher: 'SHA256' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
        expect(out[0]).toEqual(acquireSession.failed({ params: session, error: E_CRYPTO_CHANGED }));
        // Stored by Weaver up to 1.4
        const old = { network: session.network, sessionToken: 'token' } as ISession;
        const same = nodeReporting(DEFAULT_CRYPTO_SUITE);
        const restored = await runEpic(acquireSessionEpic, [acquireSession.started(old)], signedIn(old), { api: same.api });
        expect(restored).toEqual([acquireSession.failed({ params: old, error: E_CRYPTO_CHANGED }), changed, logout.started(null)]);
    });

    it('does not end the session open now for a late answer about one left since', async () => {
        const { api } = nodeReporting({ cryptoer: 'SM2', hasher: 'SM3' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn({ ...session, sessionToken: 'newer' }), { api });
        expect(out).toEqual([acquireSession.failed({ params: session, error: E_CRYPTO_CHANGED })]);
        // Nor sign out again one signed out since (its token is kept: two answers about it)
        const again = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(session, false), { api });
        expect(again).toEqual([acquireSession.failed({ params: session, error: E_CRYPTO_CHANGED })]);
    });

    it('takes a node that does not answer for offline: still signed in, no change of algorithms', async () => {
        const { client, api } = nodeReporting(DEFAULT_CRYPTO_SUITE);
        client.getUid.mockRejectedValue({ error: 'E_OFFLINE', msg: '' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
        // The app shows the session waiting for the node (no modal) and asks again
        expect(out).toEqual([acquireSession.failed({ params: session, error: 'E_OFFLINE' })]);

        const restored = { ...initialState, isAuthenticated: true, session };
        const offline = reducer(reducer(restored, acquireSession.started(session)), out[0]);
        expect(offline).toMatchObject({ isAuthenticated: true, isAcquired: false, session, sessionRetryReason: 'E_OFFLINE' });
        // Asked again, it stays the retry screen until the node answers
        expect(reducer(offline, acquireSession.started(session)).sessionRetryReason).toBe('E_OFFLINE');
        expect(reducer(offline, acquireSession.done({ params: session, result: true }))).toMatchObject({ isAcquired: true, sessionRetryReason: null });
        expect(reducer(offline, logout.done({ params: null, result: null }))).toMatchObject({ isAuthenticated: false, sessionRetryReason: null });
    });

    it('waits the same way for a node still catching up with the chain', async () => {
        const { client, api } = nodeReporting(DEFAULT_CRYPTO_SUITE);
        client.sections.mockRejectedValue({ error: 'E_UPDATING', msg: '' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
        expect(out).toEqual([acquireSession.failed({ params: session, error: 'E_UPDATING' })]);
    });

    it.each(['E_UNAUTHORIZED', 'E_TOKENEXPIRED'])('signs a session whose token the node refuses (%s) out, the sign-in page says it expired', async error => {
        const { client, api } = nodeReporting(DEFAULT_CRYPTO_SUITE);
        // The node restarted (a new token secret), or the token is past its time
        client.sections.mockRejectedValue({ error, msg: '' });
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
        expect(out).toEqual([acquireSession.failed({ params: session, error }), sessionExpired({ reason: E_TOKENEXPIRED, network: 'net', during: 'session' }), logout.started(null)]);
        const restored = { ...initialState, isAuthenticated: true, session };
        expect(out.concat(logout.done({ params: null, result: null })).reduce(reducer, restored))
            .toMatchObject({ isAuthenticated: false, signedOutBecause: { reason: E_TOKENEXPIRED, network: 'net', during: 'session' }, sessionRetryReason: null });
    });

    it('ends the session on any other error, and says why', async () => {
        for (const [error, code] of [[{ error: 'E_SERVER', msg: '' }, 'E_SERVER'], [new Error('boom'), 'boom'], [{ error: 5 }, 'E_SERVER']] as const) {
            const { api } = nodeReporting({ error });
            const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api });
            expect(out[0]).toEqual(acquireSession.failed({ params: session, error: code }));
            expect(out[1]).toEqual(expect.objectContaining({ type: modalShow.type }));
            expect(out.some(action => logout.started.match(action) || cryptoChanged.match(action))).toBe(false);
            const restored = { ...initialState, isAuthenticated: true, session };
            expect(reducer(restored, out[0])).toMatchObject({ isAuthenticated: false, isAcquired: false, sessionRetryReason: null });
        }
    });

    it('leaves no session acquired after the sign-out, so the next sign-in waits for its own', () => {
        const open = reducer({ ...initialState, isAuthenticated: true, session }, acquireSession.done({ params: session, result: true }));
        expect(open.isAcquired).toBe(true);
        expect(reducer(open, logout.done({ params: null, result: null }))).toMatchObject({ isAuthenticated: false, isAcquired: false });
    });

    it('says the algorithms changed though the sections fail first, and the sections\' error otherwise', async () => {
        // A node of the new algorithms may refuse the old session's token for the sections
        const refused = { error: 'E_TOKENEXPIRED', msg: '' };
        const changedNode = nodeReporting({ cryptoer: 'SM2', hasher: 'SM3' });
        changedNode.client.sections.mockRejectedValueOnce(refused);
        expect(await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api: changedNode.api }))
            .toEqual([acquireSession.failed({ params: session, error: E_CRYPTO_CHANGED }), changed, logout.started(null)]);
        // Same algorithms: the sections' error, as before
        const sameNode = nodeReporting(DEFAULT_CRYPTO_SUITE);
        sameNode.client.sections.mockRejectedValueOnce(refused);
        const out = await runEpic(acquireSessionEpic, [acquireSession.started(session)], signedIn(), { api: sameNode.api });
        expect(out[0]).toEqual(acquireSession.failed({ params: session, error: 'E_TOKENEXPIRED' }));
        expect(out.some(action => cryptoChanged.match(action))).toBe(false);
    });

    it('keeps the reason and its network through the sign-out until the next sign-in', () => {
        const signedOut = [changed, logout.done({ params: null, result: null })].reduce(reducer, initialState);
        expect(signedOut.signedOutBecause).toEqual({ reason: E_CRYPTO_CHANGED, network: 'net', during: 'session' });
        // In either order
        expect([logout.done({ params: null, result: null }), changed].reduce(reducer, initialState).signedOutBecause).toEqual(changed.payload);
        // Signing in again clears it, and still signs in: the session and account taken
        const fresh = { ...session, cryptoSuite: { cryptoer: 'SM2', hasher: 'SM3' } } as ISession;
        const wallet = { wallet: { id: '7', walletID: '7', address: '0000-0000-0000-0000-0007', encKey: '', publicKey: '04', access: [] }, access: { ecosystem: '1', name: '', roles: [], notifications: [] } };
        const guest = reducer(signedOut, loginGuest.done({ params: undefined, result: { session: fresh, wallet, signingKey: softwareKey('k'), publicKey: '04' } }));
        expect(guest).toMatchObject({ signedOutBecause: null, isAuthenticated: true, session: fresh, wallet });
        const selected = { ...signedOut, wallet };
        const user = reducer(selected, login.done({ params: { password: 'p' }, result: { session: fresh, signingKey: softwareKey('k'), publicKey: '04' } }));
        expect(user).toMatchObject({ signedOutBecause: null, isAuthenticated: true, session: fresh, id: '7' });
    });
});
