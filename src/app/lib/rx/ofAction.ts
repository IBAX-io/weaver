/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action as ReduxAction } from 'redux';
import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Action, ActionCreator, isType } from 'typescript-fsa';

// Narrows an action stream to actions created by any of the given typescript-fsa creators
export function ofAction<P>(creator: ActionCreator<P>): OperatorFunction<ReduxAction, Action<P>>;
export function ofAction<P1, P2>(c1: ActionCreator<P1>, c2: ActionCreator<P2>): OperatorFunction<ReduxAction, Action<P1> | Action<P2>>;
export function ofAction(...creators: ActionCreator<unknown>[]): OperatorFunction<ReduxAction, Action<unknown>> {
    return filter((action: ReduxAction): action is Action<unknown> =>
        creators.some(creator => isType(action, creator))
    );
}
