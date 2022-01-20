/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import uuid from 'uuid';
import { ITransactionCollection } from 'ibax/tx';
import { OrderedMap } from 'immutable';
import { IRootState } from 'modules';
import { connect } from 'react-redux';
import { buttonInteraction } from 'modules/content/actions';
import { TBreadcrumbType } from 'ibax/content';
import { IErrorRedirect, IAction } from 'ibax/protypo';

import Button from 'components/Button';

export interface ITxButtonProps {
    disabled?: boolean;
    silent?: boolean;
    className?: string;

    actions: IAction[];
    from?: {
        type: TBreadcrumbType;
        section: string;
        name: string;
    };

    // Called first
    confirm?: {
        icon: string;
        title: string;
        text: string;
        confirmButton: string;
        cancelButton: string;
    };

    // Executed after confirm if approved
    contracts?: {
        name: string;
        params: {
            [key: string]: any
        }[]
    }[];

    // Executed after batch
    contract?: string;
    contractParams?: { [key: string]: any } | (() => { [key: string]: any });

    // Redirect if all previous actions succeeded
    page?: string;
    section: string;
    pageParams?: { [key: string]: any } | (() => { [key: string]: any });

    // Page must be rendered within a modal dialog
    popup?: {
        title?: string;
        width?: number;
    };

    errorRedirects?: { [key: string]: IErrorRedirect } | (() => { [key: string]: IErrorRedirect });
}

interface ITxButtonState {
    transactions: OrderedMap<string, ITransactionCollection>;
}

interface ITxButtonDispatch {
    buttonInteraction: typeof buttonInteraction;
}

class TxButton extends React.Component<ITxButtonProps & ITxButtonState & ITxButtonDispatch> {
    private _uuid: string = null;

    onClick = () => {
        this._uuid = uuid.v4();

        const contractParams = 'function' === typeof this.props.contractParams ?
            this.props.contractParams() :
            this.props.contractParams;

        if (null === contractParams) {
            return;
        }
        const pageParams = 'function' === typeof this.props.pageParams ?
            this.props.pageParams() :
            this.props.pageParams;

        if (null === pageParams) {
            return;
        }

        const contracts = this.props.contracts || [];
        if (this.props.contract) {
            contracts.push({
                name: this.props.contract,
                params: [contractParams]
            });
        }

        const errorRedirects = 'function' === typeof this.props.errorRedirects ?
            this.props.errorRedirects() :
            this.props.errorRedirects;

        this.props.buttonInteraction({
            uuid: this._uuid,
            silent: this.props.silent,
            confirm: this.props.confirm,
            popup: this.props.popup,
            contracts: contracts,
            from: this.props.from,
            page: this.props.page ? {
                name: this.props.page,
                section: this.props.section,
                params: pageParams
            } : null,
            errorRedirects: errorRedirects,
            actions: this.props.actions
        });
    }

    isPending = () => {
        const tx = this.props.transactions.get(this._uuid);
        return tx && 'pending' === tx.status;
    }

    render() {
        return (
            <Button onClick={this.onClick} disabled={this.props.disabled || this.isPending()} className={this.props.className}>
                {this.props.children}
            </Button>
        );
    }
}

const mapStateToProps = (state: IRootState) => ({
    transactions: state.tx.transactions
});

const mapDispatchToProps = {
    buttonInteraction
};

export default connect<ITxButtonState, ITxButtonDispatch, ITxButtonProps>(mapStateToProps, mapDispatchToProps)(TxButton);