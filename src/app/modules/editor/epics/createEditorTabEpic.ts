/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import uuid from 'uuid';
import { Epic } from 'modules';
import { createEditorTab } from '../actions';

const createEditorTabEpic: Epic = (action$, store) => action$.ofAction(createEditorTab.started)
    .map(action => {
        const state = store.getState();

        const ids = state.editor.tabs
            .filter(l => l.new)
            .map(l => l.id)
            .sort();

        const id = (ids.length ? parseInt(ids[ids.length - 1], 10) + 1 : 1).toString();

        switch (action.payload) {
            case 'contract':
                return createEditorTab.done({
                    params: action.payload,
                    result: {
                        uuid: uuid.v4(),
                        id,
                        name: null,
                        value: 'contract ... {\n    data {\n\n    }\n    conditions {\n\n    }\n    action {\n\n    }\n}'
                    }
                });

            case 'page':
            case 'block':
            case 'menu':
                return createEditorTab.done({
                    params: action.payload,
                    result: {
                        uuid: uuid.v4(),
                        id,
                        name: null,
                        value: ''
                    }
                });

            default: return createEditorTab.failed({
                params: action.payload,
                error: null
            });
        }
    });

export default createEditorTabEpic;