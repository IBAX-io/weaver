/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { parseAddress } from 'lib/crypto/address';
import { IExplorerRow } from './utxoHistory';
import { verifyUtxoTransfer } from './utxoTransfer';

// What the IBAX testnet's node answered for these transfers
const REWARD_HASH = '7bc57a0270b111a3e74f9824ffb98a6cb37809dbc74ad56ab4a1fb445143004c';
const REWARD_TEXT = '{"blockid":"2545","confirm":0,"data":{"block_id":2545,"block_hash":"d6984a092523fde32e3c2fac7aa7b19124d6b9f52d96abf1274c5c3da1b6153d","address":"1634-8099-0439-6342-1518","ecosystem":1,"hash":"7bc57a0270b111a3e74f9824ffb98a6cb37809dbc74ad56ab4a1fb445143004c","expedite":"0","contract_name":"","params":{"utxo":{"ToID":-6561781177931602744,"Value":"100000000000000","Comment":"Rewards of 9th, May. TG winner"}},"created_at":1684717208771,"size":"239.00B","status":0}}';
const SENT_HASH = '8467691d52d2f9c77af0b81234cf55cdca90b76b6081fd462498ccd31e616b52';
const SENT_TEXT = '{"blockid":"1606","confirm":0,"data":{"block_id":1606,"block_hash":"2ca56844355ed3d49463fc2bc4d2baae7edfcb15b5b171481cd9397f7a75769e","address":"0207-6825-1974-1321-7876","ecosystem":1,"hash":"8467691d52d2f9c77af0b81234cf55cdca90b76b6081fd462498ccd31e616b52","expedite":"","contract_name":"","params":{"utxo":{"ToID":-868164129336259442,"Value":"1","Comment":""}},"created_at":1665564405293,"size":"164.00B","status":0}}';
// What it answers for a transaction it does not have
const UNKNOWN_TEXT = '{"blockid":"","confirm":0}';
const RECIPIENT = '1188-4962-8957-7794-8872';
const SENDER = '0207-6825-1974-1321-7876';

const node = (text: string) => ({ json: JSON.parse(text), text });
const rewardRow: IExplorerRow = { hash: REWARD_HASH, block: 2545, contract: 'UTXO_Tx', ecosystem: '1' };
const sentRow: IExplorerRow = { hash: SENT_HASH, block: 1606, contract: 'UTXO_Tx', ecosystem: '1' };

describe('UTXO transfers as the node records them', () => {
    it('takes a transfer as the node records it, received or sent, with the recipient exact', () => {
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT), parseAddress(RECIPIENT))).toEqual({
            hash: REWARD_HASH, blockID: '2545', time: 1684717208771, direction: 'in', counterparty: '1634-8099-0439-6342-1518',
            amount: '100000000000000', comment: 'Rewards of 9th, May. TG winner', failed: false
        });
        // The node writes ToID as a bare JSON number past 2^53: JSON.parse rounds it, so it is read
        // from the text. Rounded, it would be another address.
        expect(String(JSON.parse(SENT_TEXT).data.params.utxo.ToID)).not.toBe('-868164129336259442');
        expect(verifyUtxoTransfer(sentRow, node(SENT_TEXT), parseAddress(SENDER))).toMatchObject({
            direction: 'out', counterparty: '1757-8579-9443-7329-2174', amount: '1', comment: '', failed: false
        });
        // 2^64 - 868164129336259442 = 17578579944373292174
        expect(parseAddress('1757-8579-9443-7329-2174')).toBe('-868164129336259442');
    });

    it('takes an amount written with leading zeros, and one as large as 2^256 allows', () => {
        const recipient = parseAddress(RECIPIENT);
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"000123"')), recipient)).toMatchObject({ amount: '123' });
        const largest = '9'.repeat(78);
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT.replace('"Value":"100000000000000"', `"Value":"${largest}"`)), recipient)).toMatchObject({ amount: largest });
    });

    it('is not misled by a ToID written in the comment', () => {
        const text = REWARD_TEXT.replace('"Comment":"Rewards of 9th, May. TG winner"', '"Comment":"\\"ToID\\":5"');
        expect(verifyUtxoTransfer(rewardRow, node(text), parseAddress(RECIPIENT))).toMatchObject({ direction: 'in', comment: '"ToID":5' });
    });

    it('keeps a sender\'s comment from disguising itself', () => {
        const text = REWARD_TEXT.replace('Rewards of 9th, May. TG winner', 'pay\\u202Efor\\u200B rent');
        expect(verifyUtxoTransfer(rewardRow, node(text), parseAddress(RECIPIENT))).toMatchObject({ comment: 'pay for rent' });
        // Letters drawn as blank: a note that looks empty, or words spaced apart, is shown as such
        const blank = REWARD_TEXT.replace('Rewards of 9th, May. TG winner', 'pay\\u3164for\\u2800\\u115F\\uFFA0rent\\u1160\\u17B4');
        expect(verifyUtxoTransfer(rewardRow, node(blank), parseAddress(RECIPIENT))).toMatchObject({ comment: 'pay for rent' });
    });

    it('tells a transfer between two other accounts, and one the node does not have', () => {
        // The testnet's node account earned this transfer's fee
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT), parseAddress(SENDER))).toBe('other');
        expect(verifyUtxoTransfer(rewardRow, node(UNKNOWN_TEXT), parseAddress(RECIPIENT))).toBe('unknown');
    });

    it('marks a transfer the node recorded as failed', () => {
        expect(verifyUtxoTransfer(rewardRow, node(REWARD_TEXT.replace('"status":0', '"status":1')), parseAddress(RECIPIENT))).toMatchObject({ failed: true });
    });

    it('refuses a record that does not match the explorer\'s row', () => {
        const recipient = parseAddress(RECIPIENT);
        for (const [what, row, text] of [
            ['another transaction', { ...rewardRow, hash: SENT_HASH }, REWARD_TEXT],
            ['another block', { ...rewardRow, block: 2546 }, REWARD_TEXT],
            ['another ecosystem', { ...rewardRow, ecosystem: '2' }, REWARD_TEXT],
            ['not a UTXO transfer', rewardRow, REWARD_TEXT.replace('"params":{"utxo":{', '"params":{"x":{')],
            ['two recipients', rewardRow, REWARD_TEXT.replace('"Comment":"Rewards', '"ToID":5,"Comment":"Rewards')],
            ['a ToID outside the transfer', rewardRow, REWARD_TEXT.replace('"ToID":-6561781177931602744,', '').replace('"expedite":"0"', '"expedite":"0","meta":{"ToID":-6561781177931602744}')],
            ['a recipient that is no int64', rewardRow, REWARD_TEXT.replace('-6561781177931602744', '-99999999999999999999')],
            ['a recipient that is no integer', rewardRow, REWARD_TEXT.replace('-6561781177931602744', '-6561781177931602744.5')],
            ['an amount that is not one', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"1.5"')],
            ['a negative amount', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"-1"')],
            ['nothing transferred', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"0"')],
            ['nothing transferred, in zeros', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', '"Value":"000"')],
            ['an amount past 2^256', rewardRow, REWARD_TEXT.replace('"Value":"100000000000000"', `"Value":"${'9'.repeat(79)}"`)],
            ['a comment that is no text', rewardRow, REWARD_TEXT.replace('"Comment":"Rewards of 9th, May. TG winner"', '"Comment":5')],
            ['an unknown status', rewardRow, REWARD_TEXT.replace('"status":0', '"status":7')],
            ['a date no clock can show', rewardRow, REWARD_TEXT.replace('1684717208771', '99999999999999999')],
            ['a date before 1970', rewardRow, REWARD_TEXT.replace('1684717208771', '-1')],
            ['a sender that is no address', rewardRow, REWARD_TEXT.replace('"address":"1634-8099-0439-6342-1518"', '"address":"1634"')],
            ['a sender that is no text', rewardRow, REWARD_TEXT.replace('"address":"1634-8099-0439-6342-1518"', '"address":5')]
        ] as [string, IExplorerRow, string][]) {
            expect([what, verifyUtxoTransfer(row, node(text), recipient)]).toEqual([what, 'mismatch']);
        }
    });
});
