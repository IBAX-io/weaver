/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { from, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { changeEditorTool, getPageTree } from '../actions';

const changeEditorToolEpic: Epic = (action$, state$, { api }) => action$.pipe(
    ofAction(changeEditorTool.started),
    mergeMap(action => {
        const state = state$.value;
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });

        switch (action.payload) {
            case 'preview':
                const payload = state.editor.tabs[state.editor.tabIndex].value;
                return from(client.contentTest({
                    template: payload,
                    locale: state.storage.locale,
                    params: {}

                })).pipe(
                    map(result => changeEditorTool.done({
                        params: action.payload,
                        result: result.tree

                    })),
                    catchError(e => of(changeEditorTool.failed({
                        params: action.payload,
                        error: e
                    })))
                );

            case 'constructor':
                return of(
                    getPageTree.started(null),
                    changeEditorTool.done({
                        params: action.payload,
                        result: null
                    }));

            default:
                return of(changeEditorTool.done({
                    params: action.payload,
                    result: null
                }));
        }
    })
);

export default changeEditorToolEpic;
