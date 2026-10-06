/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Copyright (c) 2017 <https://github.com/m0a/typescript-fsa-redux-observable>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* tslint:disable */
// Epics chain RxJS 5 prototype operators on ofAction() results; load the patch here so every
// consumer of ofAction (including tests that never import store.ts) gets it.
import 'rxjs-compat';
import { ActionsObservable, StateObservable } from 'redux-observable';
import { Action, ActionCreator, isType } from 'typescript-fsa';
import * as Redux from 'redux';
import { filter } from 'rxjs/operators';

declare module 'redux-observable' {
    interface ActionsObservable<T extends Redux.Action> {
        ofAction<P>(action: ActionCreator<P>): ActionsObservable<Action<P>>;
        flatMap: (...args: any[]) => any;
        switchMap: (...args: any[]) => any;
        mergeMap: (...args: any[]) => any;
        map: (...args: any[]) => any;
        filter: (...args: any[]) => any;
        catch: (...args: any[]) => any;
        do: (...args: any[]) => any;
        delay: (...args: any[]) => any;
        takeUntil: (...args: any[]) => any;
        debounceTime: (...args: any[]) => any;
        distinctUntilChanged: (...args: any[]) => any;
        first: (...args: any[]) => any;
        startWith: (...args: any[]) => any;
    }
    interface StateObservable<S> {
        getState(): S;
    }
}

ActionsObservable.prototype.ofAction =
    function <P>(this: ActionsObservable<Action<P>>, actionCreater: ActionCreator<P>): ActionsObservable<Action<P>> {
        return this.pipe(
            filter((action: any) => isType(action, actionCreater))
        ) as ActionsObservable<Action<P>>;
    };

// Shim getState() on StateObservable for redux-observable 0.x → 1.x migration
(StateObservable.prototype as any).getState = function() {
    return this.value;
};
