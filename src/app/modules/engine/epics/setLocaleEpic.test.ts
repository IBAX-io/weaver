/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { runEpic } from 'test/runEpic';
import { saveLocale } from 'modules/storage/actions';
import { setLocale } from '../actions';

const ajaxResponse = vi.hoisted(() => ({ value: null as unknown }));
vi.mock('rxjs/ajax', () => ({
    ajax: () => of({ response: ajaxResponse.value, responseType: 'json', status: 200 })
}));

const { default: setLocaleEpic } = await import('./setLocaleEpic');

describe('setLocaleEpic', () => {
    beforeEach(() => { ajaxResponse.value = null; });

    it('falls back to en-US when the locale file is not valid JSON', async () => {
        ajaxResponse.value = null;

        const output = await runEpic(setLocaleEpic, [setLocale.started('zh-CN')]);

        expect(output).toEqual([
            saveLocale('en-US'),
            setLocale.done({ params: 'en-US', result: { locale: 'en-US', values: {} } })
        ]);
    });

    it('saves the requested locale when its messages load', async () => {
        ajaxResponse.value = { 'general.title': 'Weaver' };

        const output = await runEpic(setLocaleEpic, [setLocale.started('zh-CN')]);

        expect(output).toEqual([
            saveLocale('zh-CN'),
            setLocale.done({ params: 'zh-CN', result: { locale: 'zh-CN', values: { 'general.title': 'Weaver' } } })
        ]);
    });
});
