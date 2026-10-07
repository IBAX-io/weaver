/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { IBalanceResponse } from 'ibax/api';
import { ITxError, TTransferCall } from 'ibax/tx';
import { IConfirmModalProps } from 'components/Modal/ConfirmModal';
import { THistoryEntry, THistoryFilter } from './history';

// The ecosystem whose UTXO pays the fees of UTXO transfers (go-ibax consts.DefaultTokenEcosystem)
export const FEE_ECOSYSTEM = '1';

// Errors loading the balance or the history with their own explanation (wallet.balance.error.<code>,
// wallet.history.error.<code>); others show E_SERVER's
export const WALLET_ERRORS = ['E_OFFLINE', 'E_INVALIDWALLET', 'E_INVALID_RESPONSE', 'E_SERVER'];

export const walletErrorCode = (error: string) => WALLET_ERRORS.includes(error) ? error : 'E_SERVER';

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

// A page of the account's history in one ecosystem
export interface IHistoryPageRequest extends IBalanceOwner {
    filter: THistoryFilter;
    // The oldest row shown, to load the rows older than it; null starts over from the newest
    before: string | null;
}

export interface IHistoryPage {
    entries: THistoryEntry[];
    // Rows older than this page's
    more: number;
}

const actionCreator = actionCreatorFactory('wallet');
export const fetchBalance = actionCreator.async<IBalanceOwner, IWalletBalance, string>('FETCH_BALANCE');
export const sendTransfer = actionCreator.async<ISendTransferCall, ITransferResult, ITxError | null>('SEND_TRANSFER');
export const fetchHistory = actionCreator.async<IHistoryPageRequest, IHistoryPage, string>('FETCH_HISTORY');
