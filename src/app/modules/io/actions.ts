/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import actionCreatorFactory from 'typescript-fsa';

const actionCreator = actionCreatorFactory('io');

export const sendAttachment = actionCreator<{ name: string, data: string }>('SEND_ATTACHMENT');