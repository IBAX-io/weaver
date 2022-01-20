/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Tag from './Tag';

class Else extends Tag {

    protected tagName: string = 'Else';
    public logic: boolean = true;
    public canMove: boolean = false;
    public canCopy: boolean = false;
    public canChangePosition: boolean = false;
    protected bodyInline = false;
    protected attr: any = {
    };
    protected editProps: string[] = [];
    protected generateTextElement: boolean = false;

    renderCode(): string {

        if (this.element.children && this.element.children.length === 0) {
            return '';
        }

        let result: string = '.' + this.tagName;
        let body = this.renderChildren(this.element.children, this.offset);

        result += this.renderBody(body);
        return result;
    }
}

export default Else;