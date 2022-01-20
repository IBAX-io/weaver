/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';

import Modal from '../';
import { FormattedMessage } from 'react-intl';
import Validation from 'components/Validation';

export interface ICreatePageModalProps {
    apps: {
        id: string;
        name: string;
    }[];
    menus: string[];
}

class CreatePageModal extends Modal<ICreatePageModalProps, { name: string, app: string, menu: string, conditions: string }> {
    onSubmit = (values: { [key: string]: any }) => {
        this.props.onResult({
            name: values.name,
            menu: values.menu,
            app: values.app,
            conditions: values.conditions
        });
    }

    render() {
        return (
            <Validation.components.ValidatedForm onSubmitSuccess={this.onSubmit}>
                <Modal.Header>
                    <FormattedMessage id="editor.page.create" defaultMessage="Create page" />
                </Modal.Header>
                <Modal.Body>
                    <Validation.components.ValidatedFormGroup for="name">
                        <label htmlFor="name">
                            <FormattedMessage id="editor.page.name" defaultMessage="Name" />
                        </label>
                        <Validation.components.ValidatedControl key="name" name="name" validators={[Validation.validators.required]} />
                    </Validation.components.ValidatedFormGroup>
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
                    <Validation.components.ValidatedFormGroup for="menu">
                        <label htmlFor="menu">
                            <FormattedMessage id="editor.menu" defaultMessage="Menu" />
                        </label>
                        <Validation.components.ValidatedSelect name="menu" defaultValue={this.props.params.menus[0]} validators={[Validation.validators.required]}>
                            {this.props.params.menus.map(menu => (
                                <option key={menu} value={menu}>{menu}</option>
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

export default CreatePageModal;