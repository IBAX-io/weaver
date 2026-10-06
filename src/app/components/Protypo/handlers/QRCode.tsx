/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export interface IQRCodeProps {
    text?: string;
}

const QRCode: React.FC<IQRCodeProps> = props => (
    <QRCodeCanvas value={props.text || ''} />
);

export default QRCode;