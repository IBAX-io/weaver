/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// An https address with a host: what a network's block explorer must be (it is called from the
// wallet page, and the account's address is sent to it)
export const isHttpsUrl = (value: string) => /^https:\/\/[^\s/?#]+(?:[/?#]\S*)?$/.test(value);
