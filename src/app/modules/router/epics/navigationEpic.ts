/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ignoreElements, tap } from 'rxjs/operators';
import { Epic } from 'modules';
import { ofAction } from 'lib/rx/ofAction';
import { navigate } from '../actions';

const navigationEpic: Epic = (action$, state$, { navigation }) => action$.pipe(
    ofAction(navigate),
    // ignoreElements() takes `unknown`, which would otherwise widen the inferred input of tap
    tap<ReturnType<typeof navigate>>(action => navigation.navigate(action.payload)),
    ignoreElements()
);

export default navigationEpic;
