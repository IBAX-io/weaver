/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Button extends Tag {
    protected tagName: string = 'Button';
    protected attr: any = {
        'class': 'Class',
        'page': 'Page',
        'pageparams': 'PageParams',
        'contract': 'Contract'
    };
    protected editProps = ['class', 'btn', 'align', 'transform', 'wrap'];
}

export default Button;