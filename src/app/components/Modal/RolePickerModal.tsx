/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { IRoleInfo } from 'ibax/api';

import Modal, { ModalContainer, IModalProps } from './';
import Avatar from 'containers/Avatar';

export interface IRolePickerModalParams {
    account: string;
    ecosystem: string;
    ecosystemName: string;
    roles: IRoleInfo[];
}

export interface IRolePickerModalProps extends IModalProps<IRolePickerModalParams, void> {
    onSwitchWallet: (role: string) => void;
}

class RolePickerModal extends ModalContainer<IRolePickerModalProps> {
    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="auth.role.select" defaultMessage="Role selection" />
                </Modal.Header>
                <Modal.Body>
                    <div className="float-start">
                        <Avatar
                            size={44}
                            account={this.props.params.account}
                            ecosystem={this.props.params.ecosystem}
                        />
                    </div>
                    <div className="pl media-box-body clearfix">
                        <div>
                            <div><b>({this.props.params.ecosystem}) {this.props.params.ecosystemName}</b></div>
                            <div>
                                <span>
                                    <FormattedMessage id="auth.login.as" defaultMessage="Login with role" />:
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt">
                        {this.props.params.roles.map(r => (
                            <button key={r.id} className="btn btn-secondary w-100" onClick={() => this.props.onSwitchWallet(r.id)}>
                                {r.name}
                            </button>
                        ))}
                        <button className="btn btn-link w-100" onClick={() => this.props.onSwitchWallet(null)}>
                            <FormattedMessage id="auth.role.guest" defaultMessage="Guest" />
                        </button>
                    </div>
                </Modal.Body>
                <Modal.Footer className="text-end">
                    <Button type="button" variant="primary" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="cancel" defaultMessage="Cancel" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}
export default RolePickerModal;