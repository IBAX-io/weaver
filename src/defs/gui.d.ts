/*
 * @Author: abc
 * @Date: 2020-09-21 19:16:24
 * @LastEditors: abc
 * @LastEditTime: 2020-12-08 17:07:39
 * @Description: 
 */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/gui' {
  interface IInferredArguments {
    readonly privateKey?: string;
    readonly fullNode?: string[];
    readonly networkID?: number;
    readonly networkName?: string;
    readonly dry?: boolean;
    readonly offsetX?: number;
    readonly offsetY?: number;
    readonly socketUrl?: string;
    readonly disableHonorNodesSync?: boolean;
    readonly activationEmail?: string;
    readonly guestMode?: boolean;
  }
}