/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'rxjs';
import 'lib/external/fsa';
import { Action } from 'redux';
import { ActionsObservable } from 'redux-observable';
import { getPageTree } from '../actions';
import getPageTreeDoneEpic from './getPageTreeDoneEpic';
import dependencies from 'modules/dependencies';
import mockStore from 'test/mockStore';

describe('generatePageTemplateEpic', () => {
  it('generate PageTemplate', () => {

    const action$ = ActionsObservable.of<Action>(getPageTree.done({
      params: null,
      result: {
        jsonData: [],
        treeData: []
      }
    }
    ));
    const expectedOutput: any = [
      {
        payload: null,
        type: 'editor/SAVE_CONSTRUCTOR_HISTORY_STARTED'
      }
    ];

    getPageTreeDoneEpic(action$, mockStore, { constructorModule: dependencies.constructorModule })
      .toArray()
      .subscribe(actualOutput => {
        expect(actualOutput).toEqual(expectedOutput);
      });
  });
});