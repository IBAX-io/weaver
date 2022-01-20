/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { IWallet } from 'ibax/auth';
import QRCode from 'qrcode.react';
import CopyToClipboard from 'react-copy-to-clipboard';

import Modal from '../';

export interface ICopyWalletModalParams {
    wallet: IWallet;
}

class CopyWalletModal extends Modal<ICopyWalletModalParams, void> {
    formatKey = (key: string) => {
        return key.match(/.{1,2}/g).join(' ');
    }

    getCopyPayload = () => {
        return this.props.params.wallet.publicKey;
    }

    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="auth.wallet.share.long" defaultMessage="Share account" />
                </Modal.Header>
                <Modal.Body>
                    <table className="table table-striped table-bordered table-hover preline mb0" style={{ maxWidth: 500 }}>
                        <tbody>
                            <tr>
                                <td style={{ minWidth: 100 }}>
                                    <FormattedMessage id="general.key.public" defaultMessage="Public key" />
                                </td>
                                <td>{this.formatKey(this.props.params.wallet.publicKey)}</td>
                            </tr>
                            <tr>
                                <td>
                                    <FormattedMessage id="auth.qrcode" defaultMessage="QR-Code" />
                                </td>
                                <td>
                                    <div className="text-center">
                                        <QRCode value={this.getCopyPayload()} />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="text-center">
                        <CopyToClipboard text={this.getCopyPayload()}>
                            <Button bsStyle="link">
                                <FormattedMessage id="general.clipboard.copy" defaultMessage="Copy to clipboard" />
                            </Button>
                        </CopyToClipboard>
                    </div>
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="primary" onClick={this.props.onCancel}>
                        <FormattedMessage id="close" defaultMessage="Close" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default CopyWalletModal;