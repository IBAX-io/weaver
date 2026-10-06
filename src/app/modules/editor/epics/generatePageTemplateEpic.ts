/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { Epic } from 'modules';
import { Observable } from 'rxjs';
import { IRootState } from 'modules';
import { generatePageTemplate, updateEditorTab, setPageTemplate } from '../actions';

const generatePageTemplateEpic: Epic =
    (action$, store, { constructorModule }) => action$.ofAction(generatePageTemplate)
        .flatMap(action => {
            const state = store.getState().editor;
            const tab = state.tabs[state.tabIndex].designer;
            const jsonData = tab && tab.data && tab.data.jsonData;
            const codeGenerator = new constructorModule.CodeGenerator(jsonData);
            const pageTemplate = codeGenerator.render();

            return Observable.concat([
                updateEditorTab(pageTemplate),
                setPageTemplate(pageTemplate),
            ]);
        });

export default generatePageTemplateEpic;