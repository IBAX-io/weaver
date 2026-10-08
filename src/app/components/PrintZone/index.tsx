/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import Button from 'components/Button';
import { sendAttachment } from 'lib/fs';
import { FormattedMessage } from 'react-intl';
import { scopeChainStylesheet } from 'lib/css/chainCss';

export interface IPrintZoneProps {
    stylesheet: string;
    children?: React.ReactNode;
}

class PrintZone extends React.Component<IPrintZoneProps> {
    private _container = React.createRef<HTMLDivElement>();
    private _output = React.createRef<HTMLIFrameElement>();

    componentDidUpdate() {
        this.onRepaint();
    }

    componentDidMount() {
        this.onRepaint();
    }

    onRepaint = () => {
        setTimeout(() => {
            const output = this._output.current;
            if (!output || !output.contentDocument.body) {
                return;
            }

            output.style.height = '0px';
            output.contentDocument.body.innerHTML = this._container.current.innerHTML;
            const style = output.contentDocument.createElement('style');
            // The ecosystem's print stylesheet comes from the chain: it may style the copy, not load anything
            style.textContent = scopeChainStylesheet(this.props.stylesheet, 'body');
            output.contentDocument.body.appendChild(style);
            output.style.height = output.contentDocument.body.scrollHeight + 'px';
        });
    }

    onSave = () => {
        sendAttachment('Tx.html', this._output.current.contentDocument.body.innerHTML, 'text/html');
    }

    onPrint = () => {
        this._output.current.contentWindow.focus();
        this._output.current.contentWindow.print();
    }

    render() {
        return (
            <div>
                <div ref={this._container} style={{ position: 'absolute', top: -50000, left: -50000 }}>
                    {this.props.children}
                </div>
                {/* Same origin so it can be filled and printed; no scripts run in it */}
                <iframe
                    ref={this._output}
                    sandbox="allow-same-origin allow-modals"
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