/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { IButtonConfirm } from 'ibax/protypo';

import Modal from '../';

export interface ITxConfirmModalProps extends IButtonConfirm {
}

class TxConfirmModal extends Modal<ITxConfirmModalProps, void> {
    render() {
        return (
            <div>
                <Modal.Header>
                    {this.props.params.title ?
                        (
                            <div>{this.props.params.title}</div>
                        ) : (
                            <FormattedMessage id="modal.confirm.title" defaultMessage="Confirmation" />
                        )
                    }
                </Modal.Header>
                <Modal.Body>
                    <div>{this.props.params.text}</div>
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        {this.props.params.cancelButton ?
                            (
                                <div>{this.props.params.cancelButton}</div>
                            ) : (
                                <FormattedMessage id="cancel" defaultMessage="Cancel" />
                            )
                        }
                    </Button>
                    <Button bsStyle="primary" onClick={this.props.onResult.bind(null, true)}>
                        {this.props.params.confirmButton ?
                            (
                                <div>{this.props.params.confirmButton}</div>
                            ) : (
                                <FormattedMessage id="confirm" defaultMessage="Confirm" />
                            )
                        }
                    </Button>
                </Modal.Footer>
            </div >
        );
    }
}
export default TxConfirmModal;