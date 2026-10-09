/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as uuid from 'uuid';
import { Action } from 'redux';
import { defer, Observable, of } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { modalShow } from 'modules/modal/actions';
import ModalObservable from 'modules/modal/util/ModalObservable';
import { txAuthorize } from '../actions';
import { authorize } from 'modules/auth/actions';
import { decryptPrivateKey } from 'lib/keyring';
import { moduleKey, Pkcs11UnavailableError, softwareKey, TSigningKey } from 'lib/crypto/signer';
import { isPkcs11Error } from 'lib/pkcs11';
import { authFailureCode, displayableAuthError } from 'modules/auth/util/authErrors';
import { enqueueNotification } from 'modules/notifications/actions';

const TX_AUTHORIZE_MODAL = 'TX_AUTHORIZE';

// Unlocks the signed-in wallet's key: a stored key with its password, a module key by logging in to
// its token with the PIN (empty: the token's own PIN reader asks for it)
const txAuthorizeEpic: Epic =
    (action$, state$, { pkcs11 }) => action$.pipe(
        ofAction(txAuthorize.started),
        switchMap((action): Observable<Action> => {
            const state = state$.value;
            if (state.auth.signingKey) {
                return of(txAuthorize.done({
                    params: action.payload
                }));
            }
            else {
                const failed = () => of(txAuthorize.failed({ params: action.payload, error: null }));
                const keyRef = state.auth.wallet.wallet.module;
                const unlock = async (secret: string): Promise<TSigningKey | null> => {
                    if (keyRef) {
                        if (!pkcs11) {
                            throw new Pkcs11UnavailableError();
                        }
                        await pkcs11.login(keyRef.token.serial, secret || null);
                        return moduleKey(keyRef);
                    }
                    const privateKey = await decryptPrivateKey(state$.value.auth.wallet.wallet.encKey, secret);
                    return privateKey ? softwareKey(privateKey) : null;
                };
                return ModalObservable<string>(action$, {
                    modal: {
                        id: TX_AUTHORIZE_MODAL,
                        type: 'AUTHORIZE',
                        secret: true,
                        params: keyRef ? { purpose: 'pin' } : {}
                    },
                    success: secret => secret || keyRef
                        ? defer(() => unlock(secret)).pipe(
                            mergeMap((signingKey): Observable<Action> => signingKey
                                ? of(
                                    authorize(signingKey),
                                    txAuthorize.done({ params: action.payload })
                                )
                                : of(
                                    txAuthorize.failed({ params: action.payload, error: null }),
                                    enqueueNotification({ id: uuid.v4(), type: 'INVALID_PASSWORD', params: {} })
                                )
                            ),
                            // A wrong PIN says so as a wrong password does
                            catchError(error => isPkcs11Error(error) && 'E_PKCS11_PIN_INCORRECT' === error.code
                                ? of(
                                    txAuthorize.failed({ params: action.payload, error: null }),
                                    enqueueNotification({ id: uuid.v4(), type: 'INVALID_PASSWORD', params: {} })
                                )
                                // Not a wrong password: the stored key is corrupt, decryption failed, or
                                // the module refused (no token, a locked PIN)
                                : of(
                                    txAuthorize.failed({ params: action.payload, error: null }),
                                    modalShow({
                                        id: 'AUTH_ERROR',
                                        type: 'AUTH_ERROR',
                                        params: { error: displayableAuthError(authFailureCode(error)) }
                                    })
                                ))
                        )
                        : failed(),
                    // Pushed aside by another dialog: not the user's choice, so say why nothing happened
                    failure: reason => 'OVERLAP' === reason
                        ? of(
                            txAuthorize.failed({ params: action.payload, error: null }),
                            enqueueNotification({ id: uuid.v4(), type: 'TX_INTERRUPTED', params: {} })
                        )
                        : failed()
                });
            }
        })
    );

export default txAuthorizeEpic;
