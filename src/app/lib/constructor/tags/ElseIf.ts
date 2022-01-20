/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class ElseIf extends Tag {
    protected tagName: string = 'ElseIf';
    public logic: boolean = true;
    protected bodyInline = false;
    public canMove: boolean = false;
    public canCopy: boolean = false;
    public canChangePosition: boolean = false;
    protected attr: any = {
        'condition': 'Condition'
    };
    protected newElementAttr: any = {
        condition: '#value#'
    };
    protected editProps: string[] = ['condition'];
    protected generateTextElement: boolean = false;

    renderCode(): string {
        let result: string = '.' + this.tagName + '(';

        let body = this.renderChildren(this.element.children, this.offset);
        result += this.renderParams(this.element, body) + ')';
        result += this.renderBody(body);
        return result;
    }
}

export default ElseIf;