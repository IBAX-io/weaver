/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class RadioGroup extends Tag {

    protected tagName: string = 'RadioGroup';
    public canHaveChildren: boolean = false;
    protected attr: any = {
        'name': 'Name',
        'source': 'Source',
        'namecolumn': 'NameColumn',
        'valuecolumn': 'ValueColumn',
        'value': 'Value',
        'class': 'Class'
    };
    protected newElementAttr: any = {
        name: 'name'
    };
    protected editProps = ['class', 'name', 'source', 'namecolumn', 'valuecolumn', 'value'];
    protected generateTextElement: boolean = false;
}

export default RadioGroup;