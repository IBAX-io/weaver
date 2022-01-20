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
import { ActionsObservable } from 'redux-observable';
import { Action, ActionCreator, isType } from 'typescript-fsa';
import * as Redux from 'redux';
import 'rxjs/add/operator/filter';

declare module 'redux-observable' {
    interface ActionsObservable<T extends Redux.Action> {
        ofAction<T, P>(action: ActionCreator<P>): ActionsObservable<Action<P>>;
    }
}

ActionsObservable.prototype.ofAction =
    function <P>(this: ActionsObservable<Action<P>>, actionCreater: ActionCreator<P>): ActionsObservable<Action<P>> {
        return this.filter(action => (isType(action, actionCreater))) as ActionsObservable<Action<P>>;
    };