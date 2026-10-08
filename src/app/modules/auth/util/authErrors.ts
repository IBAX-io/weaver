/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KeyNotUsableError, UnsupportedCryptoSuiteError } from 'lib/crypto/suites';
import { InvalidEncryptedKeyError } from 'lib/keyring';
import { apiErrorCode, UntrustedNodeError } from 'lib/ibaxAPI/errors';

// Auth error codes the UI can explain; each has an auth.error.* message in every locale
export const DISPLAYABLE_AUTH_ERRORS = [
    'E_INVALID_KEY', 'E_INVALID_PASSWORD', 'E_KEYNOTFOUND', 'E_DELETEDKEY',
    'E_OFFLINE', 'E_SERVER', 'E_UPDATING', 'E_TOKENEXPIRED',
    'E_IMPORT_FAILED', 'E_UNSUPPORTED_CRYPTO', 'E_UNTRUSTED_NODE', 'E_KEY_NOT_USABLE'
];

// The auth error code for anything signing in can throw
export const authFailureCode = (error: unknown): string => {
    if (error instanceof UnsupportedCryptoSuiteError) {
        return 'E_UNSUPPORTED_CRYPTO';
    }
    if (error instanceof KeyNotUsableError) {
        return 'E_KEY_NOT_USABLE';
    }
    if (error instanceof UntrustedNodeError) {
        return 'E_UNTRUSTED_NODE';
    }
    if (error instanceof InvalidEncryptedKeyError) {
        return 'E_INVALID_KEY';
    }
    return apiErrorCode(error);
};

// Anything else (raw exception text, unknown node codes) is shown as a generic server error
export const displayableAuthError = (error: unknown) =>
    'string' === typeof error && DISPLAYABLE_AUTH_ERRORS.includes(error) ? error : 'E_SERVER';
