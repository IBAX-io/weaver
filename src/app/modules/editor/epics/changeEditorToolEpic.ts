/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { changeEditorTool, getPageTree } from '../actions';
import { Observable } from 'rxjs/Observable';

const changeEditorToolEpic: Epic = (action$, store, { api }) => action$.ofAction(changeEditorTool.started)
    .flatMap(action => {
        const state = store.getState();
        const client = api({
            apiHost: state.auth.session.network.apiHost,
            sessionToken: state.auth.session.sessionToken
        });

        switch (action.payload) {
            case 'preview':
                const payload = state.editor.tabs[state.editor.tabIndex].value;
                return Observable.fromPromise(client.contentTest({
                    template: payload,
                    locale: state.storage.locale,
                    params: {}

                })).map(result => changeEditorTool.done({
                    params: action.payload,
                    result: result.tree

                })).catch(e => Observable.of(changeEditorTool.failed({
                    params: action.payload,
                    error: e
                })));

            case 'constructor':
                return Observable.of<Action>(
                    getPageTree.started(null),
                    changeEditorTool.done({
                        params: action.payload,
                        result: null
                    }));

            default:
                return Observable.of(changeEditorTool.done({
                    params: action.payload,
                    result: null
                }));
        }
    });

export default changeEditorToolEpic;