/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { actionCreatorFactory } from 'typescript-fsa';
import { IBalanceResponse } from 'ibax/api';
import { ITxError, TTransferCall } from 'ibax/tx';
import { IConfirmModalProps } from 'components/Modal/ConfirmModal';
import { THistoryEntry, THistoryFilter } from './history';
import { IExplorerCursor, IIncompleteBlock } from './utxoHistory';
import { TUtxoHistoryEntry } from './utxoTransfer';

// The ecosystem whose UTXO pays the fees of UTXO transfers (go-ibax consts.DefaultTokenEcosystem)
export const FEE_ECOSYSTEM = '1';

// Errors loading the balance, the history or the UTXO transfers with their own explanation
// (wallet.balance.error.<code>, wallet.history.error.<code>, wallet.utxoHistory.error.<code>);
// others show E_SERVER's
// The account's address cannot be read
export const E_INVALIDWALLET = 'E_INVALIDWALLET';
export const WALLET_ERRORS = ['E_OFFLINE', E_INVALIDWALLET, 'E_INVALID_RESPONSE', 'E_SERVER'];

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

// A page of the account's UTXO transfers in one ecosystem
export interface IUtxoHistoryRequest extends IBalanceOwner {
    // Where to go on in the explorer's list; null starts over from its newest transaction
    cursor: IExplorerCursor | null;
}

export interface IUtxoHistoryPage {
    entries: TUtxoHistoryEntry[];
    // Where the next page goes on; null when the explorer's list is gone through
    next: IExplorerCursor | null;
    // The account's transactions of every kind gone through in the explorer for this page, and in
    // all (as the explorer counts them)
    checked: number;
    total: number;
    // Blocks too large to be read whole: transfers in them may be missing
    incomplete: IIncompleteBlock[];
}

// No block explorer is configured for the network: its UTXO transfers cannot be listed
export const E_NO_EXPLORER = 'E_NO_EXPLORER';
// The user has not agreed to send the account's address to it (the wallet page asks first, so this
// is never shown)
export const E_NOT_ALLOWED = 'E_NOT_ALLOWED';

export const fetchUtxoHistory = actionCreator.async<IUtxoHistoryRequest, IUtxoHistoryPage, string>('FETCH_UTXO_HISTORY');
