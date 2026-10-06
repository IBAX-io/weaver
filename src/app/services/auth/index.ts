/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IbaxAPI from 'lib/ibaxAPI';
import { resolveCryptoSuite } from 'lib/crypto/suites';

export interface IAuthenticateOptions {
    ecosystem?: string;
    expire?: number;
    role?: number;
}

// Signs the node's login challenge with the network's own crypto suite (reported by /getuid)
// and logs in. Throws UnsupportedCryptoSuiteError when the network uses a suite the client
// cannot implement, and the API error object when the node refuses the login.
export const authenticate = async (client: IbaxAPI, privateKey: string, options: IAuthenticateOptions = {}) => {
    const uid = await client.getUid();
    const suite = resolveCryptoSuite(uid.cryptoSuite);
    const publicKey = suite.publicKey(privateKey);
    const result = await client.authorize(uid.token).login({
        ...options,
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
