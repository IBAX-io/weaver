/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { concat } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { generatePageTemplate, updateEditorTab, setPageTemplate } from '../actions';

const generatePageTemplateEpic: Epic =
    (action$, state$, { constructorModule }) => action$.pipe(
        ofAction(generatePageTemplate),
        mergeMap(action => {
            const state = state$.value.editor;
            const tab = state.tabs[state.tabIndex].designer;
            const jsonData = tab && tab.data && tab.data.jsonData;
            const codeGenerator = new constructorModule.CodeGenerator(jsonData);
            const pageTemplate = codeGenerator.render();

            // The array is a single ObservableInput: emits both actions in order
            return concat([
                updateEditorTab(pageTemplate),
                setPageTemplate(pageTemplate),
            ]);
        })
    );

export default generatePageTemplateEpic;
