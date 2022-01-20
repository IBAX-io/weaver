/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';

import Modal from '../';
import { FormattedMessage } from 'react-intl';
import Validation from 'components/Validation';

interface Props {
    apps: {
        id: string;
        name: string;
    }[];
}

class CreateContractModal extends Modal<Props, { app: string, conditions: string }> {
    onSubmit = (values: { [key: string]: any }) => {
        this.props.onResult({
            app: values.app,
            conditions: values.conditions
        });
    }

    render() {
        return (
            <Validation.components.ValidatedForm onSubmitSuccess={this.onSubmit}>
                <Modal.Header>
                    <FormattedMessage id="editor.contract.create" defaultMessage="Create smart contract" />
                </Modal.Header>
                <Modal.Body>
                    <Validation.components.ValidatedFormGroup for="app">
                        <label htmlFor="app">
                            <FormattedMessage id="editor.app" defaultMessage="Application" />
                        </label>
                        <Validation.components.ValidatedSelect name="app" defaultValue={this.props.params.apps[0].id} validators={[Validation.validators.required]}>
                            {this.props.params.apps.map(app => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </Validation.components.ValidatedSelect>
                    </Validation.components.ValidatedFormGroup>
                    <Validation.components.ValidatedFormGroup for="conditions" className="mb0">
                        <label htmlFor="conditions">
                            <FormattedMessage id="editor.conditions.change" defaultMessage="Change conditions" />
                        </label>
                        <Validation.components.ValidatedTextarea name="conditions" validators={[Validation.validators.required]} />
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

export default CreateContractModal;