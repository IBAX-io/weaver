/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import Modal from '../';
import Validation from 'components/Validation';

export interface IAuthorizeModalProps {
    // 'upgrade': the password of a wallet saved by an earlier version; 'network': the password of a
    // wallet to be used on a network whose key algorithms it was not set up for
    purpose?: 'upgrade' | 'network';
}

// What the password is asked for
const PURPOSES: { [purpose in NonNullable<IAuthorizeModalProps['purpose']> | 'action']: React.ReactNode } = {
    upgrade: (
        <FormattedMessage
            id="modal.authorization.upgrade"
            defaultMessage="Enter the password this account had in the earlier version of Weaver. The account keeps this password."
        />
    ),
    network: (
        <FormattedMessage
            id="modal.authorization.network"
            defaultMessage="This network uses other key algorithms, so the account has another address on it. Enter the account's password once to set it up for this network."
        />
    ),
    action: <FormattedMessage id="modal.authorization.password" defaultMessage="Please enter your password to perform this action" />
};

class AuthorizeModal extends Modal<IAuthorizeModalProps, string> {
    onSuccess = (values: { [key: string]: any }) => {
        this.props.onResult(values.password);
    }

    render() {
        return (
            <Validation.components.ValidatedForm onSubmitSuccess={this.onSuccess}>
                <Modal.Header>
                    <FormattedMessage id="modal.authorization.title" defaultMessage="Authorization" />
                </Modal.Header>
                <Modal.Body>
                    <div className="pb">
                        {PURPOSES[(this.props.params && this.props.params.purpose) || 'action']}
                    </div>
                    <Validation.components.ValidatedFormGroup for="password">
                        <Validation.components.ValidatedControl
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            aria-label={this.props.intl.formatMessage({ id: 'general.password', defaultMessage: 'Password' })}
                            validators={[Validation.validators.required]}
                        />
                    </Validation.components.ValidatedFormGroup>
                </Modal.Body>
                <Modal.Footer className="text-end">
                    <Button type="button" variant="link" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                    <Validation.components.ValidatedSubmit variant="primary">
                        <FormattedMessage id="confirm" defaultMessage="Confirm" />
                    </Validation.components.ValidatedSubmit>
                </Modal.Footer>
            </Validation.components.ValidatedForm>
        );
    }
}
export default AuthorizeModal;