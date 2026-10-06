/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button, Card } from 'react-bootstrap';

import Modal from './';
import Validation from 'components/Validation';
import { FormattedMessage } from 'react-intl';

export interface IPromptModalProps {
    type: string;
    title: string;
    description?: string;
}

class PromptModal extends Modal<IPromptModalProps, string> {
    onSuccess(values: { [key: string]: any }) {
        this.props.onResult(values.value);
    }

    render() {
        return (
            <Validation.components.ValidatedForm onSubmitSuccess={this.onSuccess.bind(this)}>
                <Modal.Header>
                    {this.props.params.title}
                </Modal.Header>
                <Modal.Body>
                    {this.props.params.description && (
                        <Card body>
                            {this.props.params.description}
                        </Card>
                    )}
                    <Validation.components.ValidatedFormGroup for="value">
                        <Validation.components.ValidatedControl
                            type={this.props.params.type || 'text'}
                            name="value"
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
export default PromptModal;