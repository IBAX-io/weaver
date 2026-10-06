/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Client transaction format accepted by the node (go-ibax packages/transaction/raw.go, type 0x80):
//   0x80 | EncodeLengthPlusData(payload) | EncodeLengthPlusData(signature)
// payload = msgpack(types.SmartTransaction); hash = DoubleHash(payload); signature = Sign(hash),
// all with the network's crypto suite. The node tells the kinds apart by the payload: a UTXO or
// TransferSelf member makes it a UTXO (type 5) or TransferSelf (type 6) transaction, otherwise
// Header.ID names the contract to call.
import { encode } from '@msgpack/msgpack';
import { bytesToHex, concatBytes, hexToBytes } from '@noble/hashes/utils.js';
import { ITransactionBody, TTransferSelfDirection } from 'ibax/tx';
import { ICryptoSuiteId } from 'ibax/crypto';
import { resolveCryptoSuite } from 'lib/crypto/suites';
import { encodeLengthPlusData } from './convert';

export const CLIENT_TX_TYPE = 0x80;

export type TTxPayload =
    { type: 'contract'; id: number; params: { [name: string]: unknown } } |
    // toID: signed int64 account id (see lib/crypto/address parseAddress); value in base units
    { type: 'utxo'; toID: string; value: string; comment: string } |
    { type: 'transferSelf'; value: string; direction: TTransferSelfDirection };

export interface ITxContext {
    ecosystemID: number;
    networkID: number;
    cryptoSuite: ICryptoSuiteId;
    // Unix seconds; defaults to now
    time?: number;
}

export interface ISignedTransaction {
    hash: string;
    body: ITransactionBody;
    data: Uint8Array;
}

const TRANSFER_SELF_ENDS: { [K in TTransferSelfDirection]: { Source: string; Target: string } } = {
    toAccount: { Source: 'UTXO', Target: 'Account' },
    toUTXO: { Source: 'Account', Target: 'UTXO' }
};

const payloadMembers = (payload: TTxPayload): Omit<ITransactionBody, 'Header' | 'Lang'> => {
    switch (payload.type) {
        case 'contract':
            return { Params: payload.params };
        case 'utxo':
            return { UTXO: { ToID: BigInt(payload.toID), Value: payload.value, Comment: payload.comment } };
        case 'transferSelf':
            return { TransferSelf: { Value: payload.value, ...TRANSFER_SELF_ENDS[payload.direction] } };
        default:
            throw new TypeError(`Unknown transaction payload: ${JSON.stringify(payload)}`);
    }
};

export const signTransaction = (context: ITxContext, payload: TTxPayload, privateKey: string): ISignedTransaction => {
    const suite = resolveCryptoSuite(context.cryptoSuite);
    const publicKey = suite.publicKey(privateKey);
    const body: ITransactionBody = {
        Header: {
            ID: BigInt(payload.type === 'contract' ? payload.id : 0),
            Time: BigInt(context.time ?? Math.floor(Date.now() / 1000)),
            EcosystemID: BigInt(context.ecosystemID),
            KeyID: BigInt(suite.keyID(publicKey)),
            NetworkID: BigInt(context.networkID),
            PublicKey: hexToBytes(publicKey)
        },
        ...payloadMembers(payload),
        Lang: 'en'
    };

    // Integers of the node (header, int / address parameters, ToID) are bigints and encode as
    // 64-bit integers; every plain number is a float parameter and must encode as float64, which
    // the node requires even for whole values
    const buffer = encode(body, { useBigInt64: true, forceIntegerToFloat: true });
    const hash = suite.doubleHash(buffer);
    const signature = hexToBytes(suite.sign(hash, privateKey));

    return {
        hash: bytesToHex(hash),
        body,
        data: concatBytes(Uint8Array.of(CLIENT_TX_TYPE), encodeLengthPlusData(buffer), encodeLengthPlusData(signature))
    };
};
