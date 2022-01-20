/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import Modal from '../';

export interface IAuthErrorModalProps {
    error: string;
    message: string;
}

class AuthErrorModal extends Modal<IAuthErrorModalProps, void> {
    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="alert.error" defaultMessage="Error" />
                </Modal.Header>
                <Modal.Body>
                    <FormattedMessage id={`auth.error.${this.props.params.error}`} defaultMessage={this.props.params.message} />
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="primary" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="close" defaultMessage="Close" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default AuthErrorModal;