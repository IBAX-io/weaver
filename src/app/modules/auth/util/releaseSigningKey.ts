/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPkcs11 } from 'ibax/pkcs11';
import { TSigningKey } from 'lib/crypto/signer';

// The signing key is given up (signed out, or locked again): a module key's token is logged out
// of, so nothing more is signed without its PIN. A key in memory is dropped with the state.
export const releaseSigningKey = (key: TSigningKey | null, pkcs11: IPkcs11 | null) => {
    if ('module' === key?.kind && pkcs11) {
        pkcs11.logout(key.key.token.serial).catch(() => undefined);
    }
};
