/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/router' {
  type TNavigationType = 'POP' | 'PUSH' | 'REPLACE';

  interface IRouterLocation {
    readonly pathname: string;
    readonly search: string;
    readonly hash: string;
    readonly state: unknown;
    readonly key: string;
  }
}
