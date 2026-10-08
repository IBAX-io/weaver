/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Restoring a session can fail for a while without the session being any less valid: the node is
// not reachable, or is still catching up with the chain. The session is kept and asked for again,
// instead of signing the user out of an account the node never said anything about.
export const SESSION_RETRY_ERRORS = ['E_OFFLINE', 'E_UPDATING'] as const;
export type TSessionRetryError = typeof SESSION_RETRY_ERRORS[number];

// Between two attempts while the node does not answer
export const SESSION_RETRY_MS = 5000;

export const isSessionRetryError = (error: unknown): error is TSessionRetryError =>
    (SESSION_RETRY_ERRORS as readonly unknown[]).includes(error);
