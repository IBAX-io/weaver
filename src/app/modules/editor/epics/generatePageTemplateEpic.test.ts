/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'rxjs';
import 'lib/external/fsa';
import { Action } from 'redux';
import { ActionsObservable } from 'redux-observable';
import { generatePageTemplate } from '../actions';
import generatePageTemplateEpic from './generatePageTemplateEpic';
import dependencies from 'modules/dependencies';
import mockStore from 'test/mockStore';

describe('generatePageTemplateEpic', () => {
    it('generate PageTemplate', () => {

        const action$ = ActionsObservable.of<Action>(generatePageTemplate);
        const expectedOutput: any = [
            {
                type: 'editor/UPDATE_EDITOR_TAB',
                payload: 'Image(Alt: Image, Src: /img/dummy.png)\nP(Class: text-primary, Body: Paragraph text here)\nForm(){\n Label(Body: Firstname:)\n Input(Class: form-control, Name: sample input)\n}\nForm(){\n Label(Body: Lastname:)\n Input(Class: form-control, Name: sample input)\n Button(Body: Submit)\n}\nTable(Source: keysStr, Columns: "KEY_ID=id,MONEY=amount")'
            },
            {
                type: 'editor/SET_PAGE_TEMPLATE',
                payload: 'Image(Alt: Image, Src: /img/dummy.png)\nP(Class: text-primary, Body: Paragraph text here)\nForm(){\n Label(Body: Firstname:)\n Input(Class: form-control, Name: sample input)\n}\nForm(){\n Label(Body: Lastname:)\n Input(Class: form-control, Name: sample input)\n Button(Body: Submit)\n}\nTable(Source: keysStr, Columns: "KEY_ID=id,MONEY=amount")'
            }
        ];

        generatePageTemplateEpic(action$, mockStore, { constructorModule: dependencies.constructorModule })
            .toArray()
            .subscribe(actualOutput => {
                expect(actualOutput).toEqual(expectedOutput);
            });
    });
});