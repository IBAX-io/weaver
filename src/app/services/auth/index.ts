/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IbaxAPI from 'lib/ibaxAPI';
import { resolveCryptoSuite } from 'lib/crypto/suites';
import { UntrustedNodeError } from 'lib/ibaxAPI/errors';

export interface IAuthenticateOptions {
    ecosystem?: string;
    expire?: number;
    role?: number;
    // The network the user selected: without it, or for a node of another network, nothing is signed
    networkID: number;
}

// Signs the node's login challenge with the network's own crypto suite (reported by /getuid)
// and logs in. Throws UnsupportedCryptoSuiteError when the network uses a suite the client
// cannot implement, UntrustedNodeError for a node that is not a node of the selected network,
// and the API error object when the node refuses the login.
export const authenticate = async (client: IbaxAPI, privateKey: string, options: IAuthenticateOptions) => {
    const { networkID, ...loginOptions } = options;
    const uid = await client.getUid();
    if (!Number.isSafeInteger(networkID) || uid.networkID !== networkID) {
        throw new UntrustedNodeError('network');
    }
    const suite = resolveCryptoSuite(uid.cryptoSuite);
    const publicKey = suite.publicKey(privateKey);
    const result = await client.authorize(uid.token).login({
        ...loginOptions,
        publicKey,
        signature: suite.sign(uid.uid, privateKey)
    });

    return {
        result,
        networkID: uid.networkID,
        cryptoSuite: uid.cryptoSuite,
        publicKey,
        keyID: suite.keyID(publicKey)
    };
};
