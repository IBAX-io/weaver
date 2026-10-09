/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPkcs11 } from 'ibax/pkcs11';
import { IUIDResponse } from 'ibax/api';
import IbaxAPI from 'lib/ibaxAPI';
import { createSigner, ISigner, TSigningKey } from 'lib/crypto/signer';
import { IAPIError, isApiError, UntrustedNodeError } from 'lib/ibaxAPI/errors';
import { signTransaction } from 'lib/tx/transaction';

export interface IAuthenticateOptions {
    ecosystem?: string;
    // Session lifetime in seconds; without it, the longest the node opens (8 hours in go-ibax)
    expire?: number;
    role?: number;
    // The network the user selected: without it, or for a node of another network, nothing is signed
    networkID: number;
    // Module access, for a module key (lib/pkcs11)
    pkcs11?: IPkcs11 | null;
    // A session of the same node (the guest's) to send a new key's registration with. Without
    // it, a key the ecosystem does not know yet gets E_NEWUSER.
    registrar?: IbaxAPI | null;
}

export const NEW_USER_CONTRACT = '@1NewUser';
// The registration failed on the chain (the transaction's error is the message), or was not in a
// block in time
export const E_REGISTRATION = 'E_REGISTRATION';
export const REGISTRATION_TIMEOUT = 60000;
const REGISTRATION_POLL = 500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const registrationError = (msg: string): IAPIError => ({ error: E_REGISTRATION, msg });

const challenge = async (client: IbaxAPI, networkID: number) => {
    const uid = await client.getUid();
    if (!Number.isSafeInteger(networkID) || uid.networkID !== networkID) {
        throw new UntrustedNodeError('network');
    }
    return uid;
};

// A key the ecosystem does not know registers itself (go-ibax docs/api/login.md, New keys): it
// signs @1NewUser, which the chain takes from an unknown key for its own public key only and
// without fees, sent through the registrar's session; then it is in a block
const register = async (registrar: IbaxAPI, uid: IUIDResponse, signer: ISigner, ecosystem: string | undefined) => {
    const contract = await registrar.getContract({ name: NEW_USER_CONTRACT });
    const signed = await signTransaction(
        { ecosystemID: 1, networkID: uid.networkID, cryptoSuite: uid.cryptoSuite },
        { type: 'contract', id: contract.id, params: { NewPubkey: signer.publicKey, Ecosystem: BigInt(ecosystem || 1) } },
        signer
    );
    await registrar.txSend({ [signed.hash]: new Blob([signed.data.slice()]) });

    const deadline = Date.now() + REGISTRATION_TIMEOUT;
    while (Date.now() < deadline) {
        await sleep(REGISTRATION_POLL);
        const status = (await registrar.txStatus([signed.hash]).catch(() => null))?.[signed.hash];
        if (status?.errmsg) {
            throw registrationError(status.errmsg.error);
        }
        if (status?.blockid) {
            return;
        }
    }
    throw registrationError(`not in a block within ${REGISTRATION_TIMEOUT / 1000} s`);
};

const signIn = async (client: IbaxAPI, uid: IUIDResponse, key: TSigningKey, options: IAuthenticateOptions) => {
    const { networkID, pkcs11, registrar, ...loginOptions } = options;
    const signer = createSigner(key, uid.cryptoSuite, { fips: uid.fips, pkcs11: pkcs11 ?? null });
    const login = async (challenge: IUIDResponse) => client.authorize(challenge.token).login({
        ...loginOptions,
        publicKey: signer.publicKey,
        signature: await signer.sign(challenge.uid)
    });

    let result;
    try {
        result = await login(uid);
    }
    catch (error) {
        if (!registrar || !isApiError(error) || 'E_NEWUSER' !== error.error) {
            throw error;
        }
        await register(registrar, uid, signer, loginOptions.ecosystem);
        // The challenge is used up: a new one, of the same network
        result = await login(await challenge(client, networkID));
    }
    return {
        result,
        networkID: uid.networkID,
        cryptoSuite: uid.cryptoSuite,
        fips: uid.fips,
        publicKey: signer.publicKey,
        keyID: signer.keyID
    };
};

// Signs the node's login challenge with the network's own crypto suite (reported by /getuid)
// and logs in. Throws UnsupportedCryptoSuiteError when the network uses a suite the client
// cannot implement (or the module key does not serve), UntrustedNodeError for a node that is not
// a node of the selected network, FipsSignerRequiredError for a key in memory on a FIPS network,
// Pkcs11Error when the module refuses, and the API error object when the node refuses the login.
// A key the ecosystem does not know yet registers itself through options.registrar first, and
// signs in with a new challenge; a failed registration throws { error: E_REGISTRATION }.
export const authenticate = async (client: IbaxAPI, key: TSigningKey, options: IAuthenticateOptions) =>
    signIn(client, await challenge(client, options.networkID), key, options);

// The guest's session, to read the network: asked for without a signature, as every node takes
// it in every mode (go-ibax docs/api/login.md, Guest). The guest key is public, a signature with it
// proves nothing, and it is registered under the genesis suite's address only.
export const authenticateGuest = async (client: IbaxAPI, options: Omit<IAuthenticateOptions, 'role' | 'pkcs11' | 'registrar'>) => {
    const uid = await challenge(client, options.networkID);
    // The node still takes the session for its own challenge only
    const result = await client.authorize(uid.token).loginGuest({ ecosystem: options.ecosystem, expire: options.expire });
    return {
        result,
        networkID: uid.networkID,
        cryptoSuite: uid.cryptoSuite,
        fips: uid.fips,
        publicKey: '',
        keyID: result.key_id
    };
};
