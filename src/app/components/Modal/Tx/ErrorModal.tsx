/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { TTxError } from 'ibax/tx';

import Modal from '../';

export interface ITxErrorModalProps {
    type: TTxError;
    error?: string;
    params?: string[];
}

class TxErrorModal extends Modal<ITxErrorModalProps, void> {
    render() {
        const normalizedParams: { [key: string]: string } = {};
        if (this.props.params.params) {
            this.props.params.params.forEach((p, i) => {
                normalizedParams[i] = p;
            });
        }

        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id={`tx.error.${this.props.params.type}`} defaultMessage={this.props.params.type} />
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <FormattedMessage
                            id={`tx.error.${this.props.params.type}.desc`}
                            defaultMessage={this.props.params.type}
                            values={{
                                error: this.props.params.error,
                                ...normalizedParams
                            }}
                        />
                    </div>
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
export default TxErrorModal;