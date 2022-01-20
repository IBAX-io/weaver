/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import actionCreatorFactory from 'typescript-fsa';
import { IModalCall, IModalCloseCall } from 'ibax/modal';

const actionCreator = actionCreatorFactory('modal');

export const modalShow = actionCreator<IModalCall>('MODAL_SHOW');
export const modalClose = actionCreator<IModalCloseCall>('MODAL_CLOSE');