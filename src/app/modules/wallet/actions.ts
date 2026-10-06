/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { IBalanceResponse } from 'ibax/api';
import { ITxError, TTransferCall } from 'ibax/tx';
import { IConfirmModalProps } from 'components/Modal/ConfirmModal';

export interface IBalanceOwner {
    // Account address as the node formats it
    account: string;
    ecosystem: string;
}

export interface ISendTransferCall {
    transfer: TTransferCall;
    // Shown before signing; the caller formats it in the user's language
    confirm: IConfirmModalProps;
}

const actionCreator = actionCreatorFactory('wallet');
export const fetchBalance = actionCreator.async<IBalanceOwner, IBalanceResponse, string>('FETCH_BALANCE');
export const sendTransfer = actionCreator.async<ISendTransferCall, void, ITxError | null>('SEND_TRANSFER');
