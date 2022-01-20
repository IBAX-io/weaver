/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';

import Modal from './';
import { FormattedMessage } from 'react-intl';

export interface IConfirmModalProps {
    title?: string;
    description?: string;
    confirmButton?: string;
    cancelButton?: string;
}

class ConfirmModal extends Modal<IConfirmModalProps, boolean> {
    onSuccess(values: { [key: string]: any }) {
        this.props.onResult(true);
    }

    render() {
        return (
            <div>
                <Modal.Header>
                    {this.props.params.title || (
                        <FormattedMessage id="modal.confirm.title" defaultMessage="Confirmation" />
                    )}
                </Modal.Header>
                <Modal.Body>
                    {this.props.params.description}
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        {this.props.params.cancelButton || (
                            <FormattedMessage id="cancel" defaultMessage="Cancel" />
                        )}
                    </Button>
                    <Button bsStyle="primary" onClick={this.props.onResult.bind(null, true)}>
                        {this.props.params.confirmButton || (
                            <FormattedMessage id="confirm" defaultMessage="Confirm" />
                        )}
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default ConfirmModal;