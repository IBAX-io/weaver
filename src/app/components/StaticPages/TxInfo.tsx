/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { TProtypoElement } from 'ibax/protypo';
import { ITransaction } from 'ibax/tx';
import { toHex } from 'lib/tx/convert';

import Protypo from 'containers/Widgets/Protypo';
import PrintZone from 'components/PrintZone';
import { FormattedMessage } from 'react-intl';

export interface ITxInfoProps {
    section: string;
    txStack: {
        hash: string;
        tx: ITransaction;
    }[];
    stylesheet: string;
    page: string;
    children: TProtypoElement[];
}

const TxInfo: React.SFC<ITxInfoProps> = props => (
    <div className="content-wrapper">
        <PrintZone stylesheet={props.stylesheet}>
            <div style={{ padding: 20, wordBreak: 'break-all' }}>
                <div>
                    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="840 -55 2390 900" height={50}>
                        <g id="Layer_1-2">
                            <path fill="#0F0930" className="st0" d="M2108.5,124h-88.7l-173.4,470.4h86l39-113.6h185.5l39,113.6h86L2108.5,124z M2064.1,210.7l69.2,201.6h-138.4 L2064.1,210.7z M2405.5,246.3h-76.6v477.8h76.6V573.7c22.2,18.2,51.8,28.9,87.4,28.9c90.7,0,158.6-71.2,158.6-182.1 s-67.9-182.1-158.6-182.1c-35.6,0-65.2,10.8-87.4,28.9V246.3z M2405.5,333c18.1-19.5,45.7-31.6,75.3-31.6c53.8,0,92.7,39,92.7,119 s-39,119-92.7,119c-29.6,0-57.1-12.1-75.3-31.6V333L2405.5,333z M2725.4,594.5h76.6V103.9h-76.6V594.5z M3009,602.5 c40.3,0,71.9-9.4,95.4-28.9v20.8h76.7V369.3c0-97.4-45.7-131-147.9-131c-47.7,0-98.1,12.1-128.4,30.2l7.4,64.5 c34.3-19.5,75.3-31.6,117.6-31.6c53.8,0,74.6,12.8,74.6,53.1v16.7h-72.6c-100.1,0-155.9,45.7-155.9,118.3 C2876,564.9,2935.8,602.5,3009,602.5L3009,602.5z M3019.8,539.3c-40.3,0-65.9-15.5-65.9-51.1c0-34.3,22.2-55.1,80.6-55.1h69.9v74.6 C3085.6,529.3,3055.4,539.3,3019.8,539.3z" />
                            <path fill="none" stroke="#0F0930" strokeWidth="18.42" strokeLinejoin="round" d="M1655.8,499.3c36.3-63,36.3-140.5,0-203.5l-94.4-163.5c-36.3-63-103.5-101.8-176.3-101.8h-188.9 c-72.7,0-139.9,38.8-176.2,101.8l-94.4,163.6c-36.3,63-36.3,140.5,0,203.5l94.4,163.5c36.3,63,103.5,101.7,176.2,101.8h188.9 c72.7,0,139.9-38.8,176.3-101.8L1655.8,499.3z M1593.3,471.9c26.6-46,26.6-102.7,0-148.7l-86.9-150.5 c-26.6-46-75.7-74.3-128.8-74.3h-173.8c-53.1,0-102.2,28.3-128.8,74.4l-86.9,150.5c-26.6,46-26.6,102.7,0,148.7l86.9,150.5 c26.6,46,75.7,74.4,128.8,74.4h173.8c53.1,0,102.2-28.3,128.8-74.4L1593.3,471.9L1593.3,471.9z M1529.9,447.2 c17.7-30.7,17.7-68.5,0-99.2l-76.7-132.8c-17.7-30.7-50.5-49.6-85.9-49.6H1214c-35.4,0-68.2,18.9-85.9,49.6L1051.4,348 c-17.7,30.7-17.7,68.5,0,99.2l76.7,132.8c17.7,30.7,50.5,49.6,85.9,49.6h153.3c35.5,0,68.2-18.9,85.9-49.6L1529.9,447.2 L1529.9,447.2z M1457.4,446.3c17.4-30.2,17.4-67.3,0-97.5l-41.1-71.2c-17.4-30.2-49.6-48.8-84.4-48.8h-82.3 c-34.8,0-67,18.6-84.5,48.8l-41.1,71.2c-17.4,30.2-17.4,67.3,0,97.5l41.1,71.2c17.4,30.2,49.6,48.7,84.4,48.7h82.3 c34.8,0,67-18.6,84.4-48.8L1457.4,446.3L1457.4,446.3z M1380.9,447.2c17.7-30.7,17.7-68.5,0-99.2l-2.2-3.7 c-17.7-30.7-50.5-49.6-85.9-49.6h-4.3c-35.5,0-68.2,18.9-85.9,49.6l-2.2,3.7c-17.7,30.7-17.7,68.5,0,99.2l2.2,3.7 c17.7,30.7,50.5,49.6,85.9,49.6h4.3c35.5,0,68.2-18.9,85.9-49.6L1380.9,447.2z" />
                        </g>
                    </svg>
                    <div style={{ float: 'right', textAlign: 'right' }}>
                        <div>
                            <FormattedMessage id="tx.report" defaultMessage="Transaction report" />
                        </div>
                        <div>{(new Date()).toISOString()}</div>
                        <div>{process.env.REACT_APP_VERSION}</div>
                    </div>
                </div>
                <hr />
                {props.txStack.map((tx, index) => (
                    <div key={index}>
                        <ul>
                            <li>
                                <strong>{tx.hash}</strong>
                            </li>
                            {tx.tx ?
                                (
                                    <>
                                        <li>
                                            <span><strong>ID:</strong> </span>
                                            <span>{tx.tx.body.Header.ID}</span>
                                        </li>
                                        <li>
                                            <span><strong>KeyID:</strong> </span>
                                            <span>{tx.tx.body.Header.KeyID.toString()}</span>
                                        </li>
                                        <li>
                                            <span><strong>NetworkID:</strong> </span>
                                            <span>{tx.tx.body.Header.NetworkID}</span>
                                        </li>
                                        <li>
                                            <span><strong>PublicKey:</strong> </span>
                                            <span>{toHex(tx.tx.body.Header.PublicKey)}</span>
                                        </li>
                                        <li>
                                            <span><strong>EcosystemID:</strong> </span>
                                            <span>{tx.tx.body.Header.EcosystemID}</span>
                                        </li>
                                        <li>
                                            <span><strong>Time:</strong> </span>
                                            <span>{tx.tx.body.Header.Time}</span>
                                        </li>
                                        <li>
                                            <span><strong>Params</strong></span>
                                            <span>{JSON.stringify(tx.tx.body.Params)}</span>
                                        </li>
                                    </>

                                ) :
                                (
                                    <li>
                                        <FormattedMessage id="tx.data.missing" defaultMessage="Data is missing" />
                                    </li>
                                )
                            }
                        </ul>
                    </div>
                ))}
                <hr />
                <Protypo
                    section={props.section}
                    context="page"
                    content={props.children}
                />
            </div>
        </PrintZone>
    </div>
);

export default TxInfo;