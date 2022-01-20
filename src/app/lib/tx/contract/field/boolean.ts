/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';

class Boolean implements IField<string | boolean, boolean> {
    private _value: boolean = false;

    set(value: string | boolean) {
        if (!value) {
            this._value = false;
        }
        else if ('boolean' === typeof value) {
            this._value = value;
        }
        else {
            this._value = /^\s*(true|1(.(0)+)?)\s*$/i.test(value || '');
        }
    }

    get() {
        return this._value;
    }

    toString() {
        return this._value.toString();
    }
}

export default Boolean;