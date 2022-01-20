/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';

class StringCollection implements IField<string[]> {
    private _value: string[] = [];

    set(value: string[] | object) {
        if (!value) {
            this._value = [];
        }
        else if (!Array.isArray(value)) {
            this._value = [value.toString()];
        }
        else {
            this._value = value.map(v => v.toString());
        }
    }

    get(): string[] {
        return this._value;
    }

    toString() {
        return '[' + this._value.join(', ') + ']';
    }
}

export default StringCollection;