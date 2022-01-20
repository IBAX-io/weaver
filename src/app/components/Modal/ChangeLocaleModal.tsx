/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import { ILocale } from 'ibax';

import Modal from './';

export interface IChangeLocaleModalProps {
    onChangeLocale: (locale: string) => void;
    locales: ILocale[];
    value: string;
}

class ChangeLocaleModal extends Modal<IChangeLocaleModalProps, void> {
    changeLocale = (locale: string) => {
        this.props.params.onChangeLocale(locale);
        this.props.onCancel();
    }

    render() {
        return (
            <div>
                <Modal.Header>
                <FormattedMessage id="modal.locale.title" defaultMessage="Switch language" />
                </Modal.Header>
                <Modal.Body>
                    {this.props.params.locales.map(l => (
                        <Button key={l.key} block disabled={!l.enabled || l.key === this.props.params.value} type="button" bsStyle="default" onClick={() => this.changeLocale(l.key)}>
                            <span>{l.name}</span>
                        </Button>
                    ))}
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
export default ChangeLocaleModal;