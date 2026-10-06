/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'lib/external/fsa';
import { Observable } from 'rxjs';
import { ActionsObservable } from 'redux-observable';
import { locationChange } from '../actions';
import sectionLoadEpic from './sectionLoadEpic';

jest.mock('store', () => {
    const { Observable: Obs } = require('rxjs');
    return { state$: Obs.of({ auth: { isAcquired: true } }) };
});

describe('sectionLoadEpic', () => {
    it('emits no non-action value when routing throws', done => {
        const action$ = ActionsObservable.of(locationChange({
            location: { pathname: '/browse/home', search: '', hash: '', state: {} },
            action: 'PUSH'
        } as any));
        const store: any = { getState: () => ({ auth: { isAuthenticated: true } }) };
        const routerService: any = {
            matchRoute: () => { throw new Error('boom'); }
        };
        jest.spyOn(console, 'log').mockImplementation(() => null);

        const emitted: any[] = [];
        (sectionLoadEpic(action$ as any, store, { routerService } as any) as Observable<any>).subscribe({
            next: value => emitted.push(value),
            complete: () => {
                // redux-observable 1.x stops every epic when a non-action (e.g. an Error) is emitted
                expect(emitted.filter(value => !value || typeof value.type !== 'string')).toEqual([]);
                done();
            }
        });
    });
});
