/*
 * @Author: abc
 * @Date: 2020-09-14 17:49:32
 * @LastEditors: abc
 * @LastEditTime: 2020-09-14 18:12:56
 * @Description: 
 */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class ImageInput extends Tag {

    protected tagName: string = 'ImageInput';
    public canHaveChildren: boolean = false;
    protected attr: any = {
        'class': 'Class',
        'format': 'Format',
        'name': 'Name',
        'ratio': 'Ratio',
        'width': 'Width'
    };
    protected newElementAttr: any = {
        format: 'jpg',
        name: 'sample image',
        ratio: '2/1',
        width: '100'
    };
    protected editProps = ['class', 'name', 'format', 'ratio', 'width'];
    protected generateTextElement: boolean = false;
}

export default ImageInput;