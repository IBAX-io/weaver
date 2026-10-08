/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

import Validation from 'components/Validation';
import { IValidatedImageProps } from 'components/Validation/ValidatedImage';

export interface IInputProps {
    'format'?: IValidatedImageProps['format'];
    'name'?: string;
    'width'?: string;
    'ratio'?: string;
}

const ImageInput: React.FC<IInputProps> = (props) => {
    const matches = /^ *(\d*) *\/ *(\d*) *$/.exec(props.ratio);
    let ratio: number = null;
    let width: number = null;

    if (matches) {
        const left = parseInt(matches[1], 10);
        const right = parseInt(matches[2], 10);
        ratio = left / right;
    }

    try {
        width = parseInt(props.width, 10);

        // Check if value is NaN, otherwise cropper will throw
        if (width !== width) {
            width = null;
        }
    }
    catch (e) {
        width = null;
    }

    return (
        <Validation.components.ValidatedImage
            format={props.format}
            name={props.name}
            aspectRatio={ratio}
            width={width}
        />
    );
};

export default ImageInput;