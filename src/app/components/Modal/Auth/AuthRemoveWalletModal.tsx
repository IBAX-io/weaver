/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { IWallet } from 'ibax/auth';

import Modal from '../';

export interface IAuthRemoveWalletModalProps {
    wallet: IWallet;
}

class AuthRemoveWalletModal extends Modal<IAuthRemoveWalletModalProps, void> {
    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="modal.confirm.title" defaultMessage="Confirmation" />
                </Modal.Header>
                <Modal.Body>
                    <FormattedMessage id="auth.remove.desc" defaultMessage="Do you really want to delete this account? THIS ACTION IS IRREVERSIBLE" />
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="close" defaultMessage="Close" />
                    </Button>
                    <Button bsStyle="primary" onClick={this.props.onResult.bind(null, true)}>
                        <FormattedMessage id="process.confirm" defaultMessage="Confirm" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default AuthRemoveWalletModal;