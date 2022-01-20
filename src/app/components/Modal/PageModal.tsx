/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { TProtypoElement } from 'ibax/protypo';

import Modal from './';
import Page from 'components/Main/Navigator/Page';

export interface IPageModalProps {
    name: string;
    section: string;
    title: string;
    width?: number;
    tree: TProtypoElement[];
    params: {
        [key: string]: string;
    };
    static?: boolean;
}

class PageModal extends Modal<IPageModalProps, boolean> {
    onSuccess(values: { [key: string]: any }) {
        this.props.onResult(true);
    }

    render() {
        return (
            <div style={{ width: (this.props.params.width || 50) + 'vw', overflow: 'hidden' }}>
                <Modal.Header>
                    {this.props.params.title}
                </Modal.Header>
                <Modal.Body>
                    <Page
                        section={this.props.params.section}
                        value={{
                            name: this.props.params.name,
                            status: 'LOADED',
                            static: this.props.params.static,
                            content: this.props.params.tree,
                            params: this.props.params.params,
                            location: null
                        }}
                    />
                </Modal.Body>
            </div>
        );
    }
}
export default PageModal;