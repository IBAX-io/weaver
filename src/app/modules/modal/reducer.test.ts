/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import reducer, { initialState } from './reducer';
import { modalClose, modalShow } from './actions';

const answer = (type: string, secret?: boolean) => {
    const shown = reducer(initialState, modalShow({ id: 'M', type, secret, params: {} }));
    return reducer(shown, modalClose({ id: 'M', reason: 'RESULT', data: 'hunter2' })).result;
};

describe('modal reducer', () => {
    it('never keeps a password, even when the caller forgot to say it is secret', () => {
        expect(answer('AUTHORIZE')).toEqual({ reason: 'RESULT', data: null });
        expect(answer('AUTH_CHANGE_PASSWORD')).toEqual({ reason: 'RESULT', data: null });
        expect(answer('TX_CONFIRM', true)).toEqual({ reason: 'RESULT', data: null });
    });

    it('keeps the answer of other dialogs (negative control)', () => {
        expect(answer('TX_CONFIRM')).toEqual({ reason: 'RESULT', data: 'hunter2' });
    });

    it('ignores the closing of another dialog', () => {
        const shown = reducer(initialState, modalShow({ id: 'M', type: 'TX_CONFIRM', params: {} }));
        expect(reducer(shown, modalClose({ id: 'OTHER', reason: 'RESULT', data: 1 }))).toBe(shown);
    });
});
