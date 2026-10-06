/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, it, expect } from 'vitest';
import { runEpic } from 'test/runEpic';
import NetworkError from 'services/network/errors';
import { discoverNetwork } from '../actions';
import discoverNetworkEpic from './discoverNetworkEpic';

describe('discoverNetworkEpic', () => {
    it('reports an unknown network instead of crashing', async () => {
        const output = await runEpic(discoverNetworkEpic, [discoverNetwork.started({ uuid: 'missing' })]);

        expect(output).toEqual([
            discoverNetwork.failed({ params: { uuid: 'missing' }, error: NetworkError.NotFound })
        ]);
    });
});
