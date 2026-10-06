/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import uuid from 'uuid';
import { connect, ConnectedProps } from 'react-redux';
import { IRootState } from 'modules';
import { txCall } from 'modules/tx/actions';
import { ITransactionCollection } from 'ibax/tx';

import Validation from 'components/Validation';

interface IValidatedContractFormProps {
    silent?: boolean;
    className?: string;
    onExec?: (result: ITransactionCollection) => void;
    contract?: string;
    contractParams?: { [key: string]: any } | ((payload: { [key: string]: string }) => { [key: string]: any });
    children?: React.ReactNode;
}

const mapStateToProps = (state: IRootState) => ({
    transactions: state.tx.transactions
});

const mapDispatchToProps = {
    txCall
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type TValidatedContractFormProps = IValidatedContractFormProps & ConnectedProps<typeof connector>;

class ValidatedContractForm extends React.Component<TValidatedContractFormProps> {
    private _uuid: string = null;

    componentDidUpdate(prevProps: TValidatedContractFormProps) {
        const oldTransaction = prevProps.transactions.get(this._uuid);
        const newTransaction = this.props.transactions.get(this._uuid);
        const oldDone = oldTransaction && 'pending' !== oldTransaction.status;
        const newDone = newTransaction && 'pending' !== newTransaction.status;

        if (!oldDone && newDone) {
            if (this.props.onExec) {
                this.props.onExec(newTransaction);
            }
        }
    }

    onSubmit = (payload: { [key: string]: string }) => {
        this._uuid = uuid.v4();

        const contractParams = 'function' === typeof this.props.contractParams ?
            this.props.contractParams(payload) :
            this.props.contractParams;

        if (null === contractParams) {
            return;
        }

        this.props.txCall({
            uuid: this._uuid,
            silent: this.props.silent,
            contracts: [{
                name: this.props.contract,
                params: [contractParams]
            }]
        });
    }

    render() {
        const transaction = this.props.transactions.get(this._uuid);
        const pending = transaction && 'pending' === transaction.status;

        return (
            <Validation.components.ValidatedForm className={this.props.className} onSubmitSuccess={this.onSubmit} pending={pending}>
                {this.props.children}
            </Validation.components.ValidatedForm>
        );
    }
}

export default connector(ValidatedContractForm);