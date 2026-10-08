/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import themed from 'components/Theme/themed';

// The wallet page's styles
const StyledWallet = themed.section`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: ${props => props.theme.contentBackground};
    color: ${props => props.theme.contentForeground};

    .wallet__content {
        max-width: 960px;
        margin: 0 auto;
        padding: 24px 16px;
    }

    .wallet__account {
        word-break: break-all;
    }

    /* A balance stays one number (BalanceAmount): the font shrinks to the card's width (container
       units) divided by the number's length in characters, a tabular digit being about 0.6em wide,
       with a little to spare; past the smallest size the number wraps at its decimal point only */
    .wallet__balance {
        container-type: inline-size;
    }

    .wallet__amount {
        font-size: clamp(0.875rem, calc(100cqi / (var(--wallet-amount-chars, 1) * 0.62)), 1.5rem);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1.3;
    }

    .wallet__amount-part {
        white-space: nowrap;
    }

    /* History: what happened on the left, the amount on the right (below it on a narrow card) */
    .wallet__history-entry {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 4px 16px;
        padding: 10px 0;
        border-top: 1px solid var(--bs-border-color);
    }

    .wallet__history-main {
        flex: 1 1 260px;
        min-width: 0;
    }

    /* Pushed right also when it wraps under the text */
    .wallet__history-amount {
        margin-left: auto;
        text-align: end;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
    }

    /* An icon button with room enough to hit (24px) */
    .wallet__history-copy {
        min-width: 24px;
        min-height: 24px;
        padding: 0 4px;
    }

    /* A failed transfer's amount, which never moved */
    .wallet__history-amount_void {
        font-weight: normal;
        text-decoration: line-through;
        color: ${props => props.theme.contentForeground};
    }

    .wallet__history-badge {
        white-space: normal;
        text-align: start;
    }

    /* The theme's .btn has no border, which left the outline buttons as bare words */
    .wallet__history-filter .btn-outline-primary {
        border: 1px solid var(--bs-btn-border-color);
    }

    /* Secondary text that still has to be read: the theme's body color, not the faint muted grey */
    .wallet__hint,
    .wallet__unit {
        color: ${props => props.theme.contentForeground};
    }
`;

export default StyledWallet;
