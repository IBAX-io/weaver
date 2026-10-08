/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { IExplorerRow, parseExplorerPage } from './utxoHistory';

// A transfer as the testnet's explorer lists it
const REWARD_HASH = '7bc57a0270b111a3e74f9824ffb98a6cb37809dbc74ad56ab4a1fb445143004c';
const RECIPIENT = '1188-4962-8957-7794-8872';
const rewardRow: IExplorerRow = { hash: REWARD_HASH, block: 2545, contract: 'UTXO_Tx', ecosystem: '1' };

describe('reading the explorer\'s list', () => {
    it('reads a page of the explorer\'s list of an account\'s transactions', () => {
        const answer = { code: 0, data: { total: 34, page: 1, limit: 2, list: [
            { hash: REWARD_HASH, block_id: 2545, contract_name: 'UTXO_Tx', timestamp: 1684717208, address: '1634-8099-0439-6342-1518', status: 0, ecosystem_name: 'platform ecosystem', ecosystem: 1 },
            { hash: '62401f2515311653832dd17485c54334680d7d22061e9c4b8af11d406099fa5f', block_id: 2544, contract_name: '@1TokensApprove', timestamp: 1751447007, address: RECIPIENT, status: 1, ecosystem: 1 }
        ] }, message: 'Success' };
        expect(parseExplorerPage(answer, 100)).toEqual({
            total: 34,
            rows: [rewardRow, { hash: '62401f2515311653832dd17485c54334680d7d22061e9c4b8af11d406099fa5f', block: 2544, contract: '@1TokensApprove', ecosystem: '1' }]
        });
        expect(parseExplorerPage({ code: 0, data: { total: 0, list: null } }, 100)).toEqual({ total: 0, rows: [] });
    });

    it('refuses an explorer answer it cannot read, or out of block order', () => {
        const row = { hash: REWARD_HASH, block_id: 2545, contract_name: 'UTXO_Tx', ecosystem: 1 };
        for (const broken of [
            null, { code: 1, data: { total: 0, list: [] } }, { code: 0 }, { code: 0, data: { total: '3', list: [] } },
            { code: 0, data: { total: -1, list: [] } },
            { code: 0, data: { total: 1, list: [{ ...row, hash: 'ab' }] } },
            { code: 0, data: { total: 1, list: [{ ...row, block_id: '2545' }] } },
            { code: 0, data: { total: 1, list: [{ ...row, ecosystem: 0 }] } },
            { code: 0, data: { total: 1, list: [{ ...row, contract_name: null }] } },
            { code: 0, data: { total: 3, list: [row, row, row] } },
            { code: 0, data: { total: 2, list: [{ ...row, block_id: 7 }, { ...row, block_id: 8 }] } },
            { code: 0, data: { total: 1, list: { 0: row } } },
            { code: 0, data: { total: 1, list: [{ ...row, block_id: 0 }] } }
        ]) {
            expect([broken, parseExplorerPage(broken, 2)]).toEqual([broken, null]);
        }
    });
});
