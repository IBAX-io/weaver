/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// A contract call: converts the parameters to the types the contract declares, then signs it as
// a client transaction (lib/tx/transaction).
import { ISchema } from 'lib/tx/schema';
import IField, { InvalidFieldValueError } from 'lib/tx/contract/field';
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

// A parameter the transaction cannot carry: 'invalid' value, or a type a form cannot fill in
export class ContractParamError extends Error {
    constructor(readonly param: string, readonly paramType: string, readonly reason: 'invalid' | 'unsupported') {
        super(`Contract parameter '${param}' (${paramType}): ${reason}`);
        this.name = 'ContractParamError';
    }
}

export default class Contract {
    private _id: number;
    private _context: ITxContext;
    private _fields: {
        [name: string]: IField<unknown, unknown>;
    } = {};

    constructor({ id, schema, fields, ...context }: IContractContext) {
        this._id = id;
        // One timestamp, so every signature of this call covers the same transaction
        this._context = { ...context, time: context.time ?? Math.floor(Date.now() / 1000) };
        Object.keys(fields).forEach(name => {
            const param = fields[name];
            // The type comes from the node: only the schema's own entries, never Object's ("constructor")
            const Field = Object.hasOwn(schema.fields, param.type) ? schema.fields[param.type] : null;
            if (!Field) {
                throw new ContractParamError(name, param.type, 'unsupported');
            }
            const field = new Field();
            try {
                field.set(param.value);
            }
            catch (e) {
                if (e instanceof InvalidFieldValueError) {
                    throw new ContractParamError(name, param.type, 'invalid');
                }
                throw e;
            }
            this._fields[name] = field;
        });
    }

    sign(privateKey: string): ISignedTransaction {
        const params: { [name: string]: unknown } = {};
        Object.keys(this._fields).forEach(name => {
            params[name] = this._fields[name].get();
        });

        return signTransaction(this._context, { type: 'contract', id: this._id, params }, privateKey);
    }
}
