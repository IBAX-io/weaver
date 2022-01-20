/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Hint extends Tag {
    protected tagName: string = 'Hint';
    public canHaveChildren: boolean = false;
    protected attr: any = {
        'icon': 'Icon',
        'title': 'Title',
        'text': 'Text'
    };

    protected newElementAttr: any = {
        icon: 'icon-question',
        title: 'Title',
        text: 'Sample description'
    };

    protected editProps = ['icon', 'title', 'text'];
    protected generateTextElement: boolean = false;
}

export default Hint;