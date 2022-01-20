/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import Modal from '../';
import Validation from 'components/Validation';

class AuthorizeModal extends Modal<void, string> {
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
                        <FormattedMessage id="modal.authorization.password" defaultMessage="Please enter your password to perform this action" />
                    </div>
                    <Validation.components.ValidatedFormGroup for="password">
                        <Validation.components.ValidatedControl
                            type="password"
                            name="password"
                            noValidate
                            validators={[Validation.validators.required]}
                        />
                    </Validation.components.ValidatedFormGroup>
                </Modal.Body>
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
export default AuthorizeModal;