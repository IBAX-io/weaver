/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPkcs11 } from 'ibax/pkcs11';
import { IUIDResponse } from 'ibax/api';
import IbaxAPI from 'lib/ibaxAPI';
import { createSigner, softwareKey, TSigningKey } from 'lib/crypto/signer';
import { UntrustedNodeError } from 'lib/ibaxAPI/errors';

export interface IAuthenticateOptions {
    ecosystem?: string;
    expire?: number;
    role?: number;
    // The network the user selected: without it, or for a node of another network, nothing is signed
    networkID: number;
    // Module access, for a module key (lib/pkcs11)
    pkcs11?: IPkcs11 | null;
}

const challenge = async (client: IbaxAPI, networkID: number) => {
    const uid = await client.getUid();
    if (!Number.isSafeInteger(networkID) || uid.networkID !== networkID) {
        throw new UntrustedNodeError('network');
    }
    return uid;
};

const signIn = async (client: IbaxAPI, uid: IUIDResponse, key: TSigningKey, options: IAuthenticateOptions) => {
    const { networkID, pkcs11, ...loginOptions } = options;
    const signer = createSigner(key, uid.cryptoSuite, { fips: uid.fips, pkcs11: pkcs11 ?? null });
    const result = await client.authorize(uid.token).login({
        ...loginOptions,
        publicKey: signer.publicKey,
        signature: await signer.sign(uid.uid)
    });

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
export const authenticate = async (client: IbaxAPI, key: TSigningKey, options: IAuthenticateOptions) =>
    signIn(client, await challenge(client, options.networkID), key, options);

// The guest's session, to read the network. A FIPS network's client signs nothing in software:
// it asks for the session without a signature (the guest key is public, a signature with it
// proves nothing). Elsewhere it signs with the guest key, as every node accepts.
export const authenticateGuest = async (client: IbaxAPI, guestKey: string, options: Omit<IAuthenticateOptions, 'role' | 'pkcs11'>) => {
    const uid = await challenge(client, options.networkID);
    if (!uid.fips) {
        return signIn(client, uid, softwareKey(guestKey), options);
    }
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
