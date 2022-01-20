/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';

class String implements IField<string> {
    private _value: string = '';

    set(value: string) {
        this._value = value ? value.toString() : '';
    }

    get() {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default String;