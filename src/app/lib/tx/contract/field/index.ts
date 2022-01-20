/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export default interface IField<I = object, O = I> {
    set(value: I): void;
    get(): O;
    toString(): string;
}