/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AMOUNT_PROBLEMS, isBalanceUnits, parseAmount } from 'lib/tx/amount';
import { parseAddress } from 'lib/crypto/address';

// Each problem is shown as wallet.error.<problem>
export const AMOUNT_CHECK_PROBLEMS = ['required', ...AMOUNT_PROBLEMS, 'exceeds', 'feeReserve'] as const;

export type TAmountCheck =
    { units: string } |
    { problem: typeof AMOUNT_CHECK_PROBLEMS[number] };

// An amount the user typed, against the balance it is paid from (both in base units). With
// reserveFee the network fee is paid from the same balance (UTXO transfers, go-ibax
// smart.UtxoToken charges the fee before checking the amount), so the balance cannot all go.
export const checkAmount = (input: string, digits: number, available: string, reserveFee = false): TAmountCheck => {
    if (!input.trim()) {
        return { problem: 'required' };
    }
    const amount = parseAmount(input, digits);
    if (!('units' in amount)) {
        return amount;
    }
    const units = BigInt(amount.units);
    // Checked when it arrived from the node (fetchBalanceEpic); should anything else get here,
    // nothing can be sent rather than the page failing
    const balance = isBalanceUnits(available) ? BigInt(available) : 0n;
    if (units > balance) {
        return { problem: 'exceeds' };
    }
    if (reserveFee && units === balance) {
        return { problem: 'feeReserve' };
    }
    return amount;
};

// Shown as wallet.error.recipient.<problem>
export const RECIPIENT_PROBLEMS = ['required', 'invalid'] as const;

export type TRecipientCheck =
    { toID: string } |
    { problem: typeof RECIPIENT_PROBLEMS[number] };

export const checkRecipient = (input: string): TRecipientCheck => {
    if (!input.trim()) {
        return { problem: 'required' };
    }
    const toID = parseAddress(input);
    return toID === null ? { problem: 'invalid' } : { toID };
};
