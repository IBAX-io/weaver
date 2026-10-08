/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { map } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { createEditorTab, loadEditorTab } from '../actions';
import { navigate } from 'modules/router/actions';

const openEditorEpic: Epic = action$ => action$.pipe(
    ofAction(createEditorTab.done, loadEditorTab.done),
    map(() => navigate({ to: '/editor' }))
);

export default openEditorEpic;
