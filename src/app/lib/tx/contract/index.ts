/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// A contract call: converts the parameters to the types the contract declares, then signs it as
// a client transaction (lib/tx/transaction).
import { ISchema } from 'lib/tx/schema';
import IField from 'lib/tx/contract/field';
import { ISignedTransaction, ITxContext, signTransaction } from 'lib/tx/transaction';

export interface IContractContext extends ITxContext {
    id: number;
    schema: ISchema;
    fields: {
        [name: string]: IContractParam;
    };
}

export interface IContractParam {
    type: string;
    value: unknown;
}

export default class Contract {
    private _context: IContractContext;
    private _time: number;
    private _fields: {
        [name: string]: IField<unknown, unknown>;
    } = {};

    constructor(context: IContractContext) {
        this._context = context;
        this._time = context.time ?? Math.floor(Date.now() / 1000);
        Object.keys(context.fields).forEach(name => {
            const param = context.fields[name];
            const Field = this._context.schema.fields[param.type];
            const field = new Field();
            field.set(param.value);
            this._fields[name] = field;
        });
    }

    sign(privateKey: string): ISignedTransaction {
        const params: { [name: string]: unknown } = {};
        Object.keys(this._fields).forEach(name => {
            params[name] = this._fields[name].get();
        });

        return signTransaction(
            { ...this._context, time: this._time },
            { type: 'contract', id: this._context.id, params },
            privateKey
        );
    }
}
