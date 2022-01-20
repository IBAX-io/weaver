/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TProtypoElement } from 'ibax/protypo';
import Tag from './Tag';
import getParamName, { getLogicTagName } from 'lib/constructor/tags/params';

class Logic extends Tag {
    constructor(element: TProtypoElement) {
        super(element);
        this.tagName = getLogicTagName(element.tag);
        this.canHaveChildren = false;
        this.logic = true;
        this.attr = {
        };
        this.editProps = [];
        for (let attr in element.attr) {
            if (element.attr.hasOwnProperty(attr)) {
                this.attr[attr] = getParamName(attr);
                this.editProps.push(attr);
            }
        }
    }
}

export default Logic;