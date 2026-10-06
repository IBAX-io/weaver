/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { ITransactionCall, ITxError, ITransaction } from 'ibax/tx';

const actionCreator = actionCreatorFactory('tx');
export const txCall = actionCreator<ITransactionCall>('TX_CALL');
// Makes sure the private key is unlocked (asks for the password if needed)
export const txAuthorize = actionCreator.async<{}, void, void>('TX_AUTHORIZE');
export const txExec = actionCreator.async<ITransactionCall, ITransaction[], ITxError>('TX_EXEC');