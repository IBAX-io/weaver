/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { InjectedIntl } from 'react-intl';

import themed from 'components/Theme/themed';
import Header from 'containers/Modal/Header';

export interface IModalProps<P, R> {
    intl: InjectedIntl;
    params: P;
    onResult: (data: R) => void;
    onCancel: () => void;
    notify: (type: string, params: any) => void;
    children: React.ReactNode[];
}

export type TModalComponentClass<P, R> =
    React.ComponentType<IModalProps<P, R>> |
    React.SFC<IModalProps<P, R>>;

const StyledBody = themed.div`
    padding: 15px;
    min-width: 300px;
`;

const StyledFooter = themed.div`
    padding: 15px;
    background: #efefef;
    border-top: solid 1px #d0dff3;
`;

export abstract class ModalContainer<P, S = {}> extends React.Component<P, S> {
    public static Header = Header;
    public static Body = StyledBody;
    public static Footer = StyledFooter;
}

export default abstract class Modal<P, R, S = {}> extends React.Component<IModalProps<P, R>, S> {
    public static Header = Header;
    public static Body = StyledBody;
    public static Footer = StyledFooter;
}