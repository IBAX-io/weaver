/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';

import TxInfo from 'components/StaticPages/TxInfo';

export interface ITxInfoProps {
    txhashes: string;
}

const findTx = (state: IRootState, hash: string) => {
    const keys = state.tx.transactions.keys();

    let value = keys.next();
    while (!value.done) {
        const stack = state.tx.transactions.get(value.value).stack;
        const tx = stack.find(l => l.hash === hash);

        if (tx) {
            return tx;
        }

        value = keys.next();
    }

    return undefined;
};

const mapStateToProps = (state: IRootState, props: ITxInfoProps) => ({
    stylesheet: state.content.printStylesheet,
    txStack: props.txhashes
        .split(',')
        .filter(hash => /^[a-f0-9]{64}$/i.test(hash))
        .map(hash => ({
            hash,
            tx: findTx(state, hash)
        }))
});

export default connect(mapStateToProps)(TxInfo);