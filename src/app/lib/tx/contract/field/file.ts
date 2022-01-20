/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import IField from './';

export interface IFileStruct {
    name: string;
    type: string;
    value: ArrayBuffer;
}

export interface IFileData {
    Name: string;
    MimeType: string;
    Body: ArrayBuffer;
}

class File implements IField<IFileStruct, IFileData> {
    private _value: IFileStruct;

    set(value: IFileStruct) {
        this._value = value;
    }

    get() {
        return this._value ? {
            Name: this._value.name,
            MimeType: this._value.type,
            Body: this._value.value
        } : null;
    }

    toString() {
        return '[BLOB]';
    }
}

export default File;