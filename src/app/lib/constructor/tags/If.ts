/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { idGenerator } from 'lib/constructor';
import Tag from './Tag';

class If extends Tag {
    protected tagName: string = 'If';
    public logic: boolean = true;
    protected bodyInline = false;
    protected attr: any = {
        'condition': 'Condition'
    };
    protected newElementAttr: any = {
        condition: '#value#'
    };
    protected editProps: string[] = ['condition'];
    protected generateTextElement: boolean = false;

    renderCode(): string {
        let result: string = this.renderOffset();
        result += this.tagName + '(';

        let body = this.renderChildren(this.element.children, this.offset);
        result += this.renderParams(this.element, body) + ')';
        result += this.renderBody(body);

        let tail = this.renderChildren(this.element.tail, this.offset, '');

        result += tail;
        return result;
    }

    generateTreeJSON(text: string): any {
        return {
            ...this.generateBaseTreeJSON(text),
            children: [],
            tail: [
                {
                    tag: 'else',
                    id: idGenerator.generateId(),
                    children: []
                }
            ]
        };
    }
}

export default If;