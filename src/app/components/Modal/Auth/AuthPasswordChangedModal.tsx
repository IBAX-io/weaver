/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

import Modal from '../';

class AuthPasswordChangedModal extends Modal<{}, void> {
    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="alert.info" defaultMessage="Information" />
                </Modal.Header>
                <Modal.Body>
                    <div><FormattedMessage id="auth.password.changed" defaultMessage="Password changed. Please login with new password" /></div>
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
export default AuthPasswordChangedModal;