/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';
import { TProtypoElement } from 'ibax/protypo';

class Em extends Tag {
    constructor(element: TProtypoElement) {
        super(element);
        this.tagName = 'Em';
        this.HTMLTag = 'i';
    }
}

export default Em;