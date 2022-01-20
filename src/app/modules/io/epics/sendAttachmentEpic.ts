/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRootState } from 'modules';
import { Epic } from 'redux-observable';
import { Action } from 'redux';
import { Observable } from 'rxjs/Observable';
import { sendAttachment } from '../actions';
import { sendAttachment as fsSend } from 'lib/fs';

const sendAttachmentEpic: Epic<Action, IRootState> =
    (action$, store) => action$.ofAction(sendAttachment)
        .flatMap(action => {
            fsSend(action.payload.name, action.payload.data);
            return Observable.empty();
        });

export default sendAttachmentEpic;