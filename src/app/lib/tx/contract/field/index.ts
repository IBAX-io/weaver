/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Converts a form value into the type a contract parameter declares (go-ibax smart.FillTxData).
// A value that cannot be represented exactly throws InvalidFieldValueError: it is never
// truncated, wrapped or replaced by 0, because the user would sign something else than typed.
export default interface IField<I = object, O = I> {
    set(value: I): void;
    get(): O;
    toString(): string;
}

export class InvalidFieldValueError extends Error {
    constructor(readonly value: unknown) {
        super('Invalid field value');
        this.name = 'InvalidFieldValueError';
    }
}
