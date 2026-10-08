/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRouterLocation, TNavigationType } from 'ibax/router';

export type { IRouterLocation, TNavigationType };

export interface IRouterState {
    readonly location: IRouterLocation;
    readonly action: TNavigationType;
}

export interface INavigateCall {
    readonly to: string;
    readonly replace?: boolean;
    readonly state?: unknown;
}

export interface INavigationService {
    navigate(call: INavigateCall): void;
}
