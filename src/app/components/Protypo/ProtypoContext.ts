/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { TProtypoElement, ISource } from 'ibax/protypo';
import { IMenu, TBreadcrumbType } from 'ibax/content';
import type Protypo from './Protypo';

export interface IProtypoContextValue {
    protypo: Protypo;
    section: string;
    menuPush: (params: { section: string, menu: IMenu }) => void;
    resolveSource: (name: string) => ISource;
    resolveText: (value: React.ReactNode) => string;
    renderElements: (elements: TProtypoElement[], keyPrefix?: string) => React.ReactNode[];
    getFromContext: (computeTitle?: React.ReactNode) => { type: TBreadcrumbType, section: string, title: string, name: string } | undefined;
}

// Provided by Protypo for every element it renders. Handlers are only ever rendered
// below a Protypo instance, so the default value is never observed in practice.
export const ProtypoContext = React.createContext<IProtypoContextValue>(null);
ProtypoContext.displayName = 'ProtypoContext';

