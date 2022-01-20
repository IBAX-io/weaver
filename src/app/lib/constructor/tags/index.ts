/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Button from './Button';
import Div from './Div';
import Em from './Em';
import Form from './Form';
import Image from './Image';
import ImageInput from './ImageInput';
import Input from './Input';
import Label from './Label';
import P from './P';
import RadioGroup from './RadioGroup';
import Span from './Span';
import Strong from './Strong';
import Table from './Table';
import If from './If';
import ElseIf from './ElseIf';
import Else from './Else';
import Data from './Data';
import Hint from './Hint';
import Logic from './Logic';

const tagHandlers = {
    list: {
        'button': Button,
        'div': Div,
        'em': Em,
        'form': Form,
        'image': Image,
        'imageinput': ImageInput,
        'input': Input,
        'label': Label,
        'p': P,
        'radiogroup': RadioGroup,
        'span': Span,
        'strong': Strong,
        'table': Table,
        'if': If,
        'elseif': ElseIf,
        'else': Else,
        'data': Data,
        'hint': Hint
    },
    default: Logic
};

const resolveTagHandler = (name: string) => {
    return tagHandlers.list[name] || tagHandlers.default;
};

export default resolveTagHandler;
