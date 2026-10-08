/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { EMPTY } from 'rxjs';
import { runEpicLoop } from './runEpic';

describe('runEpicLoop', () => {
    it('fails naming what was dispatched when the awaited action never comes', async () => {
        await expect(runEpicLoop(() => EMPTY, [{ type: 'START' }], { until: action => 'NEVER' === action.type, untilMs: 100 }))
            .rejects.toThrow('dispatched: START');
    });
});
