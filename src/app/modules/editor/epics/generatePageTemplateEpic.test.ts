/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { Action } from 'redux';
import { generatePageTemplate } from '../actions';
import generatePageTemplateEpic from './generatePageTemplateEpic';
import dependencies from 'modules/dependencies';
import mockState from 'test/mockStore';
import { runEpic } from 'test/runEpic';

describe('generatePageTemplateEpic', () => {
    it('generate PageTemplate', async () => {

        const actions: Action[] = [generatePageTemplate];
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

        const actualOutput = await runEpic(generatePageTemplateEpic, actions, mockState, { constructorModule: dependencies.constructorModule });
            expect(actualOutput).toEqual(expectedOutput);
    });
});