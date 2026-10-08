/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// What a failed API request rejects with (lib/ibaxAPI): the node's error code, its message and
// the message parameters, or E_OFFLINE when the node could not be reached
export interface IAPIError {
    error: string;
    msg?: string;
    params?: string[];
}

export const isApiError = (error: unknown): error is IAPIError =>
    !!error && typeof error === 'object' && typeof (error as { error?: unknown }).error === 'string';

// The node answered something no IBAX node would: its login challenge could make the user sign
// data that is not a login (go-ibax getuid: uid and network_id are decimal numbers), or it
// belongs to another network than the one selected
export class UntrustedNodeError extends Error {
    constructor(readonly reason: 'challenge' | 'network') {
        super(`Untrusted node response: ${reason}`);
        this.name = 'UntrustedNodeError';
    }
}

// The node answered with data the client cannot use (e.g. a balance that is not a number)
export class InvalidResponseError extends Error {
    constructor(readonly endpoint: string) {
        super(`Invalid response from ${endpoint}`);
        this.name = 'InvalidResponseError';
    }
}

// The error code to show for anything an API call can throw
export const apiErrorCode = (error: unknown) =>
    isApiError(error) ? error.error : error instanceof InvalidResponseError ? 'E_INVALID_RESPONSE' : 'E_SERVER';
