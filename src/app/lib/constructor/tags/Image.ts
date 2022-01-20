/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Image extends Tag {
    protected tagName: string = 'Image';
    public canHaveChildren: boolean = false;
    protected attr: any = {
        'source': 'Source',
        'src': 'Src',
        'alt': 'Alt'
    };

    protected newElementAttr: any = {
        alt: 'Image',
        src: '/img/dummy.png'
    };

    protected editProps = ['class', 'src', 'alt'];
    protected generateTextElement: boolean = false;
}

export default Image;