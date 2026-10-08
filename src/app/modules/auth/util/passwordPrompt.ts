/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { defer, Observable, of } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import * as uuid from 'uuid';
import { modalShow } from 'modules/modal/actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { enqueueNotification } from 'modules/notifications/actions';
import { authFailureCode } from './authErrors';

export type TPasswordPromptError = 'E_INVALID_PASSWORD' | 'E_SERVER' | 'E_CANCELLED';

interface IPasswordPrompt {
    // The prompt's id: one prompt of a kind at a time (it would take another one's answer)
    id: string;
    // What the prompt says the password is for (AuthorizeModal)
    purpose: 'upgrade' | 'network';
    // The private key the password decrypts; null when the password is wrong
    decrypt: (password: string) => Promise<string | null>;
    // What is done with the key
    withKey: (privateKey: string, password: string) => Observable<Action>;
    failed: (error: TPasswordPromptError) => Action;
}

// Asks for a stored wallet's password (kept out of the state) and does something with its key. A
// wrong password, a key that cannot be read and a cancelled prompt each end in failed.
export const promptPassword = (action$: Observable<Action>, prompt: IPasswordPrompt) => ModalObservable<string>(action$, {
    modal: { id: prompt.id, type: 'AUTHORIZE', secret: true, params: { purpose: prompt.purpose } },
    success: password => defer(() => prompt.decrypt(password)).pipe(
        mergeMap((privateKey): Observable<Action> => privateKey
            ? prompt.withKey(privateKey, password)
            : of(
                prompt.failed('E_INVALID_PASSWORD'),
                enqueueNotification({ id: uuid.v4(), type: 'INVALID_PASSWORD', params: {} })
            )),
        // A stored key this client cannot read (E_INVALID_KEY), or anything else
        catchError(error => of(
            prompt.failed('E_SERVER'),
            modalShow({ id: 'AUTH_ERROR', type: 'AUTH_ERROR', params: { error: authFailureCode(error) } })
        ))
    ),
    failure: () => of(prompt.failed('E_CANCELLED'))
});
