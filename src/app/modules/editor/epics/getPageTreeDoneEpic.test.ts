/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { Action } from 'redux';
import { getPageTree } from '../actions';
import getPageTreeDoneEpic from './getPageTreeDoneEpic';
import dependencies from 'modules/dependencies';
import mockState from 'test/mockStore';
import { runEpic } from 'test/runEpic';

describe('generatePageTemplateEpic', () => {
  it('generate PageTemplate', async () => {

    const actions: Action[] = [getPageTree.done({
      params: null,
      result: {
        jsonData: [],
        treeData: []
      }
    }
    )];
    const expectedOutput: any = [
      {
        payload: null,
        type: 'editor/SAVE_CONSTRUCTOR_HISTORY_STARTED'
      }
    ];

    const actualOutput = await runEpic(getPageTreeDoneEpic, actions, mockState, { constructorModule: dependencies.constructorModule });
      expect(actualOutput).toEqual(expectedOutput);
  });
});