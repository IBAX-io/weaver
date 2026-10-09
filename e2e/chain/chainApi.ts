/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Direct node calls the chain tests share: what a test sets up or checks on the network itself,
// besides what it lets the client do
import { expect } from 'vitest';
import { IPkcs11 } from 'ibax/pkcs11';
import { ICryptoSuiteId } from 'ibax/crypto';
import IbaxAPI from 'lib/ibaxAPI';
import { createSigner, softwareKey, TSigningKey } from 'lib/crypto/signer';
import { ISignedTransaction, signTransaction } from 'lib/tx/transaction';
import { NEW_USER_CONTRACT } from 'services/auth';

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The API's errors are plain objects ({ error, msg })
export const refusal = async (promise: Promise<unknown>) => {
    try {
        await promise;
    }
    catch (error) {
        return error as { error: string; msg?: string };
    }
    throw new Error('the node accepted it');
};

export const maxBlockID = async (apiHost: string) =>
    Number((await (await fetch(`${apiHost}/api/v2/maxblockid`)).json()).max_block_id);

// Sends one transaction and waits until it is in a block
export const execute = async (client: IbaxAPI, signed: ISignedTransaction) => {
    await client.txSend({ [signed.hash]: new Blob([signed.data.slice()]) });
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
        await sleep(250);
        const status = (await client.txStatus([signed.hash]).catch(() => null))?.[signed.hash];
        if (status?.errmsg) {
            throw new Error(`transaction failed: ${JSON.stringify(status.errmsg)}`);
        }
        if (status?.blockid) {
            expect(status.penalty).toBe(0);
            return status;
        }
    }
    throw new Error(`transaction ${signed.hash} not in a block within 60 s`);
};

// The node operator's own keys (a node's key, the guest key) sign in memory, as the operator's
// tools do whatever mode the node runs in: the client's FIPS rule is the client's, not the node's
export const operatorSigner = (privateKey: string, suite: ICryptoSuiteId) =>
    createSigner(softwareKey(privateKey), suite, { fips: false, pkcs11: null });

// The guest's session (no signature, every node takes it): what a test reads with, and sends a new
// key's registration through
export const guestClient = async (api: IbaxAPI, networkID: number) => {
    const uid = await api.getUid();
    expect(uid.networkID).toBe(networkID);
    return api.authorize((await api.authorize(uid.token).loginGuest({})).token);
};

// Signs in with a key. An unknown key (E_NEWUSER) registers itself first, as the app does
// (services/auth): it signs @1NewUser for its own public key, sent with the guest's session, and
// signs a new challenge once that is in a block. A module key signs on its token.
export const register = async (api: IbaxAPI, key: TSigningKey, networkID: number, pkcs11: IPkcs11 | null = null) => {
    const login = async () => {
        const uid = await api.getUid();
        expect(uid.networkID).toBe(networkID);
        const signer = createSigner(key, uid.cryptoSuite, { fips: false, pkcs11 });
        const result = await api.authorize(uid.token).login({ publicKey: signer.publicKey, signature: await signer.sign(uid.uid) });
        return { result, keyID: signer.keyID };
    };
    try {
        return await login();
    }
    catch (error) {
        if ('E_NEWUSER' !== (error as { error?: string })?.error) {
            throw error;
        }
    }
    const guest = await guestClient(api, networkID);
    const uid = await api.getUid();
    const signer = createSigner(key, uid.cryptoSuite, { fips: false, pkcs11 });
    const contract = await guest.getContract({ name: NEW_USER_CONTRACT });
    await execute(guest, await signTransaction(
        { ecosystemID: 1, networkID, cryptoSuite: uid.cryptoSuite },
        { type: 'contract', id: contract.id, params: { NewPubkey: signer.publicKey, Ecosystem: 1n } },
        signer
    ));
    return login();
};
