/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Epic } from 'modules';
import { createEditorTab, loadEditorTab } from '../actions';
import { isType } from 'typescript-fsa';
import { push } from 'connected-react-router';

const openEditorEpic: Epic = (action$, store) => action$
    .filter(action => isType(action, createEditorTab.done) || isType(action, loadEditorTab.done))
    .map(() => push('/editor'));

export default openEditorEpic;