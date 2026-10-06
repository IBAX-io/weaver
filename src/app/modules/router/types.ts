/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type TNavigationType = 'POP' | 'PUSH' | 'REPLACE';

export interface IRouterLocation {
    readonly pathname: string;
    readonly search: string;
    readonly hash: string;
    readonly state: unknown;
    readonly key: string;
}

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
