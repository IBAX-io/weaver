/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { EMPTY, from, iif, merge, Observable, of } from 'rxjs';
import { filter, mergeMap, take } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { buttonInteraction } from 'modules/content/actions';
import { isType } from 'typescript-fsa';
import { txCall, txExec } from 'modules/tx/actions';
import { modalShow, modalClose } from 'modules/modal/actions';
import { navigate } from 'modules/router/actions';
import { renderPage } from 'modules/sections/actions';
import { createEditorTab, loadEditorTab } from 'modules/editor/actions';

const buttonInteractionEpic: Epic = (action$, state$, { routerService }) => action$.pipe(
    ofAction(buttonInteraction),
    // Show confirmation window if there is any
    mergeMap(rootAction => iif(
        () => !!rootAction.payload.confirm,
        merge(
            of(modalShow({
                id: rootAction.payload.uuid,
                type: 'TX_CONFIRM',
                params: rootAction.payload.confirm
            })),
            action$.pipe(
                ofAction(modalClose),
                take(1),
                mergeMap(modalPayload => iif(
                    () => 'RESULT' === modalPayload.payload.reason,
                    of(rootAction),
                    EMPTY
                ))
            )
        ),
        of(rootAction)

    ).pipe(
        mergeMap((action: Action): Observable<Action> => {
            if (isType(action, buttonInteraction) && action.payload.contracts.length) {
                if (state$.value.auth.isDefaultWallet) {
                    return of(modalShow({
                        id: 'TX_ERROR',
                        type: 'TX_ERROR',
                        params: {
                            type: 'E_GUEST_VIOLATION'
                        }
                    }));
                }

                return merge(
                    of(txCall({
                        uuid: action.payload.uuid,
                        silent: action.payload.silent,
                        section: action.payload.from.section,
                        contracts: action.payload.contracts,
                        errorRedirects: action.payload.errorRedirects
                    })),
                    action$.pipe(
                        ofAction(txExec.done, txExec.failed),
                        filter(l => action.payload.uuid === l.payload.params.uuid),
                        take(1),
                        mergeMap(result => {
                            if (isType(result, txExec.done)) {
                                return of({
                                    ...action,
                                    meta: {
                                        ...action.meta,
                                        txHashes: result.payload.result.map(l => l.hash)
                                    }
                                });
                            }
                            else {
                                return EMPTY;
                            }
                        })
                    )
                );
            }
            else {
                return of(action);
            }

        }),
        mergeMap((action: Action): Observable<Action> => {
            if (isType(action, buttonInteraction) && action.payload.page) {
                const params = action.payload.page.params;
                if ('txinfo' === action.payload.page.name) {
                    params.txhashes = ((action.meta || {}).txHashes || []).join(',');
                }

                if (action.payload.popup) {
                    return of(renderPage.started({
                        location: null,
                        section: action.payload.page.section,
                        name: action.payload.page.name,
                        params: action.payload.page.params,
                        popup: action.payload.popup
                    }));
                }
                else {
                    const redirectUrl = routerService.generateRoute(`/browse/${action.payload.page.section}/${action.payload.page.name}`, action.payload.page.params);
                    return of(
                        navigate({ to: redirectUrl, state: { from: action.payload.from } })
                    );
                }
            }
            else {
                return of(action);
            }

        }),
        mergeMap((action: Action): Observable<Action> => {
            if (isType(action, buttonInteraction)) {
                return from(action.payload.actions).pipe(
                    mergeMap((buttonAction): Observable<Action> => {
                        switch (buttonAction.name) {
                            case 'CREATE': return of(createEditorTab.started(buttonAction.params.Type));
                            case 'EDIT': return of(loadEditorTab.started({ type: buttonAction.params.Type, name: buttonAction.params.Name }));
                            default: return EMPTY;
                        }
                    })
                );
            }
            else {
                return of(action);
            }
        })
    ))
);

export default buttonInteractionEpic;
