/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import Button from 'components/Button';
import { sendAttachment } from 'lib/fs';
import { FormattedMessage } from 'react-intl';

export interface IPrintZoneProps {
    stylesheet: string;
}

class PrintZone extends React.Component<IPrintZoneProps> {
    private _container: HTMLDivElement;
    private _output: HTMLIFrameElement;

    componentDidUpdate() {
        this.onRepaint();
    }

    componentDidMount() {
        this.onRepaint();
    }

    onRepaint = () => {
        setTimeout(() => {
            if (!this._output || !this._output.contentDocument.body) {
                return;
            }

            this._output.style.height = '0px';
            this._output.contentDocument.body.innerHTML = this._container.innerHTML;
            const style = this._output.contentDocument.createElement('style');
            style.innerText = this.props.stylesheet;
            this._output.contentDocument.body.appendChild(style);
            this._output.style.height = this._output.contentDocument.body.scrollHeight + 'px';
        });
    }

    onSave = () => {
        sendAttachment('Tx.html', this._output.contentDocument.body.innerHTML, 'text/html');
    }

    onPrint = () => {
        this._output.contentWindow.focus();
        this._output.contentWindow.print();
    }

    render() {
        return (
            <div>
                <div ref={l => this._container = l} style={{ position: 'absolute', top: -50000, left: -50000 }}>
                    {this.props.children}
                </div>
                <iframe
                    ref={l => this._output = l}
                    scrolling="no"
                    style={{
                        background: '#fff',
                        width: '100%',
                        boxSizing: 'border-box',
                        border: 'dashed 1px #999',
                        outline: 0,
                        padding: 0,
                        margin: 0
                    }}
                />
                <hr />
                <span>
                    <Button className="btn btn-primary" onClick={this.onSave}>
                        <FormattedMessage id="general.save" defaultMessage="Save" />
                    </Button>
                </span>
                <span style={{ marginLeft: 15 }}>
                    <Button className="btn btn-primary" onClick={this.onPrint}>
                        <FormattedMessage id="general.print" defaultMessage="Print" />
                    </Button>
                </span>

            </div>
        );
    }
}

export default PrintZone;