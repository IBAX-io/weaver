/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Div extends Tag {
    protected tagName: string = 'Div';
    protected HTMLTag: string = 'div';
    protected generateTextElement = false;
}

export default Div;