/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Auth error codes the UI can explain; each has an auth.error.* message in every locale
export const DISPLAYABLE_AUTH_ERRORS = [
    'E_INVALID_KEY', 'E_INVALID_PASSWORD', 'E_KEYNOTFOUND', 'E_DELETEDKEY',
    'E_OFFLINE', 'E_SERVER', 'E_UPDATING', 'E_TOKENEXPIRED',
    'E_IMPORT_FAILED', 'E_UNSUPPORTED_CRYPTO'
];

// Anything else (raw exception text, unknown node codes) is shown as a generic server error
export const displayableAuthError = (error: unknown) =>
    'string' === typeof error && DISPLAYABLE_AUTH_ERRORS.includes(error) ? error : 'E_SERVER';
