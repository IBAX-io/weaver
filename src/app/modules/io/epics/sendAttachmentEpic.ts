/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { sendAttachment } from '../actions';
import { sendAttachment as fsSend } from 'lib/fs';

const sendAttachmentEpic: Epic =
    action$ => action$.pipe(
        ofAction(sendAttachment),
        mergeMap(action => {
            fsSend(action.payload.name, action.payload.data);
            return EMPTY;
        })
    );

export default sendAttachmentEpic;
