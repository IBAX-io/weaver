/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import ProtypoConstructor from './ProtypoConstructor';
import Button from './handlers/Button';
import If from './handlers/If';
import ElseIf from './handlers/ElseIf';
import Else from './handlers/Else';
import Div from './handlers/Div';
import Span from './handlers/Span';
import Strong from './handlers/Strong';
import Em from './handlers/Em';
import Form from './handlers/Form';
import Image from './handlers/Image';
import ImageInput from './handlers/ImageInput';
import Input from './handlers/Input';
import Label from './handlers/Label';
import P from './handlers/P';
import RadioGroup from './handlers/RadioGroup';
import Hint from './handlers/Hint';

import Table from './handlers/Table';
import Logic from './handlers/Logic';

const handlers = {
    'button': Button,
    'if': If,
    'elseif': ElseIf,
    'else': Else,
    'div': Div,
    'span': Span,
    'strong': Strong,
    'em': Em,
    'form': Form,
    'image': Image,
    'imageinput': ImageInput,
    'input': Input,
    'label': Label,
    'p': P,
    'radiogroup': RadioGroup,
    'table': Table,
    'hint': Hint
};

export const resolveHandler = (name: string) => {
    return handlers[name] || Logic;
};

export default ProtypoConstructor;