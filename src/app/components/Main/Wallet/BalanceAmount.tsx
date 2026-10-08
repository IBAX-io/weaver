/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

const NO_BREAK_SPACE = '\u00A0';

interface Props {
    // As formatAmount writes it: "1 234 567.5"
    amount: string;
    symbol: string;
}

// A balance read as one number at any width: the font shrinks to fit the whole number on one line
// (see .wallet__amount), and only at its smallest does the number wrap, at the decimal point, where
// the second line plainly continues it
const BalanceAmount: React.FC<Props> = props => {
    const point = props.amount.indexOf('.');
    const integer = -1 === point ? props.amount : props.amount.slice(0, point);
    const fraction = -1 === point ? '' : props.amount.slice(point);
    const symbol = <>{NO_BREAK_SPACE}<small>{props.symbol}</small></>;
    // The number, the space, the token
    const style = { '--wallet-amount-chars': props.amount.length + NO_BREAK_SPACE.length + props.symbol.length } as React.CSSProperties;

    return (
        <div className="wallet__amount" style={style}>
            {fraction ? (
                <>
                    <span className="wallet__amount-part">{integer}</span>
                    <wbr />
                    <span className="wallet__amount-part">{fraction}{symbol}</span>
                </>
            ) : (
                <span className="wallet__amount-part">{integer}{symbol}</span>
            )}
        </div>
    );
};

export default BalanceAmount;
