/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Input extends Tag {
    protected tagName: string = 'Input';
    public canHaveChildren: boolean = false;
    protected attr: any = {
        'class': 'Class',
        'name': 'Name',
        'placeholder': 'Placeholder',
        'type': 'Type',
        'value': 'Value'
    };
    protected newElementAttr: any = {
        name: 'sample input',
        class: 'form-control'
    };
    protected editProps = ['class', 'align', 'transform', 'wrap', 'placeholder', 'value'];
    protected generateTextElement: boolean = false;
}

export default Input;