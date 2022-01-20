/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';

import Modal from '../';
import { FormattedMessage } from 'react-intl';

export interface IRemoveNetworkModalProps {
    uuid: string;
    name: string;
}

class RemoveNetworkModal extends Modal<IRemoveNetworkModalProps, string> {
    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="modal.confirm.title" defaultMessage="Confirmation" />
                </Modal.Header>
                <Modal.Body>
                    <FormattedMessage
                        id="modal.network.remove.confirmation"
                        defaultMessage="Do you really want to delete network {name}?"
                        values={{
                            name: this.props.params.name
                        }}
                    />
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                    <Button bsStyle="primary" onClick={this.props.onResult.bind(null, this.props.params.uuid)}>
                        <FormattedMessage id="confirm" defaultMessage="Confirm" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default RemoveNetworkModal;