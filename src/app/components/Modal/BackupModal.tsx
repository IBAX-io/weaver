/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { sendAttachment } from 'lib/fs';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';

import Modal from './';

interface Props {
    privateKey: string;
    publicKey: string;
    address: string;
    onCopy: () => void;
}

class BackupModal extends Modal<Props, void> {
    onKeyDownload = () => {
        sendAttachment(`${this.props.params.address || 'account'}.txt`, this.props.params.privateKey);
    }

    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="general.wallet.backup" defaultMessage="Backup account" />
                </Modal.Header>
                <Modal.Body>
                    <table className="table table-striped table-bordered table-hover preline" style={{ wordBreak: 'break-all' }}>
                        <tbody>
                            <tr>
                                <td style={{ minWidth: 100 }}>
                                    <FormattedMessage id="general.key.private" defaultMessage="Private key" />
                                </td>
                                <td>
                                    <span>
                                        {this.props.params.privateKey}
                                    </span>
                                    <CopyToClipboard text={this.props.params.privateKey} onCopy={this.props.params.onCopy}>
                                        <Button bsStyle="link" className="p0 ml" style={{ verticalAlign: 'top' }}>
                                            <FormattedMessage id="general.clipboard.copy" defaultMessage="Copy to clipboard" />
                                        </Button>
                                    </CopyToClipboard>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ minWidth: 100 }}>
                                    <FormattedMessage id="general.key.public" defaultMessage="Public key" />
                                </td>
                                <td>{this.props.params.publicKey}</td>
                            </tr>
                            <tr>
                                <td>
                                    <FormattedMessage id="general.address" defaultMessage="Address" />
                                </td>
                                <td>{this.props.params.address}</td>
                            </tr>
                            <tr>
                                <td>
                                    <FormattedMessage id="auth.qrcode" defaultMessage="QR-Code" />
                                </td>
                                <td>
                                    <div className="text-center">
                                        <QRCode value={this.props.params.privateKey} />
                                        <div className="text-muted">
                                            <FormattedMessage id="auth.qrcode.desc" defaultMessage="Use this code to import the account on your mobile device" />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="text-center">
                        <Button bsStyle="link" onClick={this.onKeyDownload}>
                            <FormattedMessage id="general.download.asfile" defaultMessage="Download as file" />
                        </Button>
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
export default BackupModal;