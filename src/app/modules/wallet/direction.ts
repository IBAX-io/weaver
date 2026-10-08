/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Which way tokens went from the account's side
export type TDirection = 'in' | 'out' | 'self';

// From the sender's and recipient's key IDs; null when the account is neither
export const transferDirection = (sender: string, recipient: string, keyID: string): TDirection | null => {
    const fromMe = sender === keyID;
    const toMe = recipient === keyID;
    return fromMe && toMe ? 'self' : fromMe ? 'out' : toMe ? 'in' : null;
};
