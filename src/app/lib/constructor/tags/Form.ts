/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Form extends Tag {
    protected tagName: string = 'Form';
    protected generateTextElement: boolean = false;
}

export default Form;