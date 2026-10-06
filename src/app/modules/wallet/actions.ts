/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { IBalanceResponse } from 'ibax/api';
import { ITxError, TTransferCall } from 'ibax/tx';
import { IConfirmModalProps } from 'components/Modal/ConfirmModal';

// The ecosystem whose UTXO pays the fees of UTXO transfers (go-ibax consts.DefaultTokenEcosystem)
export const FEE_ECOSYSTEM = '1';

// Balance errors with their own explanation (wallet.balance.error.<code>); others show E_SERVER's
export const BALANCE_ERRORS = ['E_OFFLINE', 'E_INVALIDWALLET', 'E_INVALID_RESPONSE', 'E_SERVER'];

export interface IBalanceOwner {
    // Account address as the node formats it
    account: string;
    ecosystem: string;
}

export interface IWalletBalance {
    value: IBalanceResponse;
    // Ecosystem 1, whose UTXO balance pays the fees of a UTXO transfer in any ecosystem
    // (go-ibax smart.UtxoToken); the same as value in ecosystem 1
    fee: IBalanceResponse;
}

export interface ISendTransferCall {
    transfer: TTransferCall;
    // Shown before signing; the caller formats it in the user's language
    confirm: IConfirmModalProps;
    // Added to the confirmation when the recipient has no account on this network
    unknownRecipientWarning?: string;
}

export interface ITransferResult {
    hash: string;
}

const actionCreator = actionCreatorFactory('wallet');
export const fetchBalance = actionCreator.async<IBalanceOwner, IWalletBalance, string>('FETCH_BALANCE');
export const sendTransfer = actionCreator.async<ISendTransferCall, ITransferResult, ITxError | null>('SEND_TRANSFER');
