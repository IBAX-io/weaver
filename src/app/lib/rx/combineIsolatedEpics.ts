/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'redux';
import { combineEpics, Epic } from 'redux-observable';
import { catchError } from 'rxjs/operators';

// An error that escapes an epic would otherwise complete it, and with redux-observable that ends
// the whole root epic: every epic silently stops reacting until reload. Each epic is restarted
// on its own instead, so one failure never takes the others down.
export const isolateEpic = <S, D>(epic: Epic<Action, Action, S, D>, name: string): Epic<Action, Action, S, D> =>
    (action$, state$, dependencies) => epic(action$, state$, dependencies).pipe(
        catchError((error, restarted) => {
            console.error(`Epic "${name}" failed and was restarted`, error);
            return restarted;
        })
    );

export const combineIsolatedEpics = <S, D>(epics: { [name: string]: Epic<Action, Action, S, D> }) =>
    combineEpics(...Object.entries(epics).map(([name, epic]) => isolateEpic(epic, name)));
