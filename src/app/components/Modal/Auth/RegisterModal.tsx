/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { IWallet } from 'ibax/auth';

import Modal from '../';
import Action from 'components/Auth/Wallet/Action';
import CopyToClipboard from 'react-copy-to-clipboard';

export interface IRegisterModalParams {
    activationEmail: string;
    wallet: IWallet;
}

class RegisterModal extends Modal<IRegisterModalParams, void> {
    onEmail = () => {
        window.location.href = `mailto:${this.props.params.activationEmail}?body=${this.props.params.wallet.publicKey}`;
    }

    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="auth.wallet.registration" defaultMessage="Activation" />
                </Modal.Header>
                <Modal.Body>
                    <Action
                        icon="icon-envelope-letter"
                        title={<FormattedMessage id="auth.wallet.registration.type.email" defaultMessage="Activate using E-Mail" />}
                        description={
                            <div>
                                <div>
                                    <FormattedMessage id="auth.wallet.registration.type.email.desc" defaultMessage="To activate using E-Mail copy your public key and send it to {mail}" values={{ mail: this.props.params.activationEmail }} />
                                </div>
                                <CopyToClipboard text={this.props.params.wallet.publicKey}>
                                    <Button bsStyle="link" className="p0 m0">
                                        <FormattedMessage id="auth.wallet.copy.public" defaultMessage="Copy public key" />
                                    </Button>
                                </CopyToClipboard>
                            </div>
                        }
                        action={<FormattedMessage id="auth.wallet.registration.type.email.confirm" defaultMessage="Send E-Mail" />}
                        onClick={this.onEmail}
                    />
                    {/*
                    <hr />
                    <Action
                        icon="icon-screen-smartphone"
                        title="Активация через мобильное приложение"
                        description="Для активации через мобильное приложение выберите данную опцию и следуйте дальнейшим инструкциям"
                        action="Использовать мобильное приложение"
                        onClick={null}
                    />*/}
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="primary" onClick={this.props.onCancel}>
                        <FormattedMessage id="close" defaultMessage="Close" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default RegisterModal;