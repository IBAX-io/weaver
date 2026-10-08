/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

enum NetworkError {
    Offline = 'E_OFFLINE',
    NotFound = 'E_NETWORK_NOT_FOUND',
    UnsupportedCrypto = 'E_UNSUPPORTED_CRYPTO',
    IDMismatch = 'E_IDMISMATCH',
    ServerMisconfiguration = 'E_SERVER_MISCONFIGURATION'
}

export default NetworkError;