/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import QRCodeNative from 'qrcode.react';

export interface IQRCodeProps {
    text?: string;
}

const QRCode: React.SFC<IQRCodeProps> = props => (
    <QRCodeNative value={props.text || ''} />
);

export default QRCode;