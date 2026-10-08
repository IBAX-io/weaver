/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Action as ReduxAction } from 'redux';
import { OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Action, ActionCreator, isType } from 'typescript-fsa';

type TPayloadOf<C> = C extends ActionCreator<infer P> ? P : never;

// Narrows an action stream to actions created by any of the given typescript-fsa creators
export const ofAction = <C extends ActionCreator<any>[]>(...creators: C): OperatorFunction<ReduxAction, Action<TPayloadOf<C[number]>>> =>
    filter((action: ReduxAction): action is Action<TPayloadOf<C[number]>> =>
        creators.some(creator => isType(action, creator))
    );
