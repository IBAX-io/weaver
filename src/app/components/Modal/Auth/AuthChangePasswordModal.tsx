/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';
import Modal from '../';
import { FormattedMessage } from 'react-intl';
import Validation from 'components/Validation';
import keyring from 'lib/keyring';

export interface IAuthChangePasswordModalProps {
    encKey: string;
}

export interface IAuthChangePasswordModalState {
    newPassword: string;
    newPasswordKey: string;
    newPasswordRepeat: string;
}

class AuthChangePasswordModal extends Modal<IAuthChangePasswordModalProps, {}, IAuthChangePasswordModalState> {

    constructor(props: any) {
        super(props);
        this.state = {
            newPassword: '',
            newPasswordKey: Math.random().toString(),
            newPasswordRepeat: ''
        };
    }

    onSubmit = (values: { [key: string]: any }) => {
        const privateKey = keyring.decryptAES(this.props.params.encKey, values.password_old);

        if (!keyring.validatePrivateKey(privateKey)) {
            this.props.notify('INVALID_PASSWORD', {});
        }
        else {
            this.props.onResult({
                oldPassword: values.password_old,
                newPassword: values.password_new
            });
        }
    }

    onNewPasswordChange = (value: string) => {
        this.setState({
            newPassword: value,
            newPasswordKey: Math.random().toString()
        });
    }

    onNewPasswordRepeatChange = (value: string) => {
        this.setState({
            newPasswordRepeat: value
        });
    }

    render() {
        return (
            <Validation.components.ValidatedForm onSubmitSuccess={this.onSubmit}>
                <Modal.Header>
                    <FormattedMessage id="auth.password.change" defaultMessage="Change password" />
                </Modal.Header>
                <Modal.Body>
                    <Validation.components.ValidatedFormGroup for="password_old">
                        <label htmlFor="password_old">
                            <FormattedMessage id="general.password.old" defaultMessage="Old password" />
                        </label>
                        <Validation.components.ValidatedControl key="password_old" name="password_old" type="password" validators={[Validation.validators.password]} />
                        <div className="visible-md visible-lg text-left">
                            <Validation.components.ValidationMessage for="password_old" />
                        </div>
                    </Validation.components.ValidatedFormGroup>
                    <Validation.components.ValidatedFormGroup for="password_new">
                        <label htmlFor="password_new">
                            <FormattedMessage id="general.password.new" defaultMessage="New password" />
                        </label>
                        <Validation.components.ValidatedControl
                            name="password_new"
                            type="password"
                            value={this.state.newPassword}
                            validators={[Validation.validators.password]}
                            onChange={(e: any) => this.onNewPasswordChange(e.target.value)}
                        />
                        <div className="visible-md visible-lg text-left">
                            <Validation.components.ValidationMessage for="password_new" />
                        </div>
                    </Validation.components.ValidatedFormGroup>
                    <Validation.components.ValidatedFormGroup for="password_new_repeat">
                        <label htmlFor="password_new_repeat">
                            <FormattedMessage id="general.password.repeat" defaultMessage="Repeat password" />
                        </label>
                        <Validation.components.ValidatedControl
                            key={this.state.newPasswordKey}
                            name="password_new_repeat"
                            type="password"
                            value={this.state.newPasswordRepeat}
                            validators={[Validation.validators.password, Validation.validators.compare(this.state.newPassword)]}
                            onChange={(e: any) => this.onNewPasswordRepeatChange(e.target.value)}
                        />
                        <div className="visible-md visible-lg text-left">
                            <Validation.components.ValidationMessage for="password_new_repeat" />
                        </div>
                    </Validation.components.ValidatedFormGroup>

                </Modal.Body >
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                    <Validation.components.ValidatedSubmit bsStyle="primary">
                        <FormattedMessage id="confirm" defaultMessage="Confirm" />
                    </Validation.components.ValidatedSubmit>
                </Modal.Footer>
            </Validation.components.ValidatedForm>
        );
    }
}

export default AuthChangePasswordModal;
