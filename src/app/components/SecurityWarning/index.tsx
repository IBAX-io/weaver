/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';

export interface ISecurityWarningProps {
    className?: string;
    close: () => void;
}

const SecurityWarning: React.SFC<ISecurityWarningProps> = props => (
    <div className={props.className}>
        <div>
            {props.children}
            <a href="#" onClick={() => props.close()}><em className="icon icon-close" /></a>
        </div>
    </div>
);

export default themed(SecurityWarning)`    
    background: ${props => props.theme.securityWarningBackground};
    color: ${props => props.theme.securityWarningForeground};
    position: fixed;
    top: 5px;
    left: 50%;
    margin-left: -150px;
    width: 300px;
    padding: 10px 25px 10px 20px;
    line-height: 20px;
    z-index: 20000;
    div {
        position: relative;
    }
    a {
        position: absolute;
        right: -5px;
        top: 50%;
        line-height: 20px;
        margin-top: -10px;
        color: ${props => props.theme.securityWarningForeground};
        text-decoration: none;
    }
`;
