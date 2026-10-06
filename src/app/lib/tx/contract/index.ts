/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Client transaction format accepted by the node (go-ibax packages/transaction/raw.go, type 0x80):
//   0x80 | EncodeLengthPlusData(payload) | EncodeLengthPlusData(signature)
// payload = msgpack({Header, Params, Lang}); hash = DoubleHash(payload); signature = Sign(hash),
// all with the network's crypto suite.
import { encode } from '@msgpack/msgpack';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { encodeLengthPlusData, concatBytes } from '../convert';
import { ISchema } from 'lib/tx/schema';
import IField from 'lib/tx/contract/field';
import { ITransactionBody } from 'ibax/tx';
import { ICryptoSuiteId, resolveCryptoSuite } from 'lib/crypto/suites';

export interface IContractContext {
    id: number;
    schema: ISchema;
    ecosystemID: number;
    networkID: number;
    cryptoSuite: ICryptoSuiteId;
    fields: {
        [name: string]: IContractParam;
    };
}

export interface IContractParam {
    type: string;
    value: unknown;
}

export interface ISignedContract {
    hash: string;
    header: Uint8Array;
    body: ITransactionBody;
    data: Uint8Array;
}

export default class Contract {
    private _context: IContractContext;
    private _time: number;
    private _fields: {
        [name: string]: IField<unknown, unknown>;
    } = {};

    constructor(context: IContractContext) {
        this._context = context;
        this._time = Math.floor(Date.now() / 1000);
        Object.keys(context.fields).forEach(name => {
            const param = context.fields[name];
            const Field = this._context.schema.fields[param.type];
            const field = new Field();
            field.set(param.value);
            this._fields[name] = field;
        });
    }

    sign(privateKey: string): ISignedContract {
        const suite = resolveCryptoSuite(this._context.cryptoSuite);
        const publicKey = suite.publicKey(privateKey);
        const { buffer, body } = this.serialize(publicKey, BigInt(suite.keyID(publicKey)));
        const hash = suite.doubleHash(buffer);
        const signature = hexToBytes(suite.sign(hash, privateKey));

        return {
            hash: bytesToHex(hash),
            header: this._context.schema.header,
            body,
            data: concatBytes(
                this._context.schema.header,
                encodeLengthPlusData(buffer),
                encodeLengthPlusData(signature)
            )
        };
    }

    serialize(publicKey: string, keyID: bigint) {
        const params: { [name: string]: unknown } = {};
        Object.keys(this._fields).forEach(name => {
            params[name] = this._fields[name].get();
        });

        const body: ITransactionBody = {
            Header: {
                ID: this._context.id,
                Time: this._time,
                EcosystemID: this._context.ecosystemID,
                KeyID: keyID,
                NetworkID: this._context.networkID,
                PublicKey: hexToBytes(publicKey)
            },
            Params: params,
            Lang: 'en'
        };

        // KeyID is an int64 on the node: encode bigints as msgpack int64
        return {
            buffer: encode(body, { useBigInt64: true }),
            body
        };
    }
}
