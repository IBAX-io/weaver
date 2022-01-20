/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TProtypoElement } from 'ibax/protypo';
import { idGenerator } from 'lib/constructor';
import resolveTagHandler from 'lib/constructor/tags';
import getParamName, { getTailTagName } from 'lib/constructor/tags/params';
import { isSimpleBody, quoteValueIfNeeded, getParamsStr } from 'lib/constructor/helpers';

class Tag {
    protected element: TProtypoElement;
    protected tagName: string = 'Tag';
    protected HTMLTag: string = null;
    public canHaveChildren: boolean = true;
    public canMove: boolean = true;
    public canCopy: boolean = true;
    public canChangePosition: boolean = true;
    protected offset: number = 0;
    protected generateTextElement = true;
    public logic = false;

    protected attr: any = {
        'class': 'Class'
    };

    protected newElementAttr: any = {};

    protected editProps = ['class', 'align', 'transform', 'wrap', 'color'];

    protected bodyInline = true;
    protected dataAttr = false;

    constructor(element: TProtypoElement | null) {
        this.element = element;
    }
    setOffset(offset: number): void {
        this.offset = offset;
    }
    renderOffset(): string {
        return Array(this.offset + 1).join(' ');
    }

    getParam(value: any, attr: string): string {
        let param = '';
        if (value) {
            if (typeof value === 'string') {
                param = getParamName(attr) + ': ' + quoteValueIfNeeded(value);
            }
            if (typeof value === 'object') {
                param = getParamsStr(getParamName(attr), value);
            }
        }
        return param;
    }
    getBasicParamsArr(element: TProtypoElement) {
        let params: string[] = [];

        if (element.attr) {
            Object.keys(element.attr).forEach(attr => {
                if (!(this.dataAttr && attr === 'data')) {
                    let param = this.getParam(element.attr[attr], attr);
                    if (param) {
                        params.push(param);
                    }
                }
            });
        }
        return params;
    }
    renderParams(element: TProtypoElement, body: string): string {
        let params: string[] = this.getBasicParamsArr(element);

        if (body && this.bodyInline && isSimpleBody(body)) {
            params.push('Body: ' + body);
        }

        return params.join(', ');
    }
    renderData(): string {
        let result = '';
        if (this.dataAttr && this.element && this.element.attr && this.element.attr.data) {
             result += '{\n'
                + this.renderOffset() + '   '
                + this.element.attr.data
                + '\n'
                + this.renderOffset()
                + '}';
        }
        return result;
    }
    renderTailTag(element: TProtypoElement): string {
        const tagName = getTailTagName(element.tag);
        if (tagName) {
            const children = this.renderChildren(element.children, this.offset);
            return '.' + tagName
                + '('
                + this.renderParams(element, children)
                + ')'
                + (children ?
                    ('{\n' + children + '\n' + this.renderOffset() + '}')
                    :
                    '');
        }
        return '';
    }
    renderTail(): string {
        let result = '';
        if (this.element.tail && this.element.tail.length) {
            result = this.element.tail.map((element) => {
                return this.renderTailTag(element);
            }).join('');
        }
        return result;
    }
    renderBody(body: string): string {
        let result = '';
        if (body && (!this.bodyInline || !isSimpleBody(body))) {
            result = '{\n' + body + '\n' + this.renderOffset() + '}';
        }
        return result;
    }
    renderCode(): string {
        const body = this.renderChildren(this.element.children, this.offset);

        let result: string = this.renderOffset();
        result += this.tagName + '(';
        result += this.renderParams(this.element, body) + ')';
        result += this.renderData();
        result += this.renderBody(body);
        result += this.renderTail();

        return result;
    }

    renderChildren(children: TProtypoElement[], offset: number = 0, delimeter: string = '\n'): string {
        if (!children) {
            return '';
        }
        return children.map((element, index) => {
            switch (element.tag) {
                case 'text':
                    return quoteValueIfNeeded(element.text);
                default:
                    const Handler = resolveTagHandler(element.tag);
                    let tag = new Handler(element);
                    tag.setOffset(offset + 1);
                    return tag.renderCode();
            }
        }).join(delimeter);
    }
    getClass(): string {
        const classValue = this.element.attr && (this.element.attr.class || this.element.attr.className) || '';
        if (classValue) {
            return ' class="' + classValue + '"';
        }
        return '';
    }
    renderHTML(): string {
        if (this.HTMLTag) {
            let result: string = '<' + this.HTMLTag;
            result += this.getClass();
            result += '>';
            const children = this.renderHTMLChildren();
            if (children === null) {
                return null;
            }
            result += children;
            result += '</' + this.HTMLTag + '>';
            return result;
        }
        else {
            return null;
        }
    }
    renderHTMLChildren(): string {
        let resultArr = (this.element.children || []).map((element, index) => {
            switch (element.tag) {
                case 'text':
                    return element.text;
                default:
                    const Handler = resolveTagHandler(element.tag);
                    let tag = new Handler(element);
                    return tag.renderHTML();
            }
        });

        // if any of subtags has null -> result is null
        if (resultArr.indexOf(null) !== -1) {
            return null;
        }

        return resultArr.join('');
    }

    generateBaseTreeJSON(text: string): any {
        return {
            tag: this.tagName.toLowerCase(),
            id: idGenerator.generateId(),
            attr: this.newElementAttr,
            children: this.generateTextElement ? [{
                tag: 'text',
                text: text,
                id: idGenerator.generateId()
            }] : null
        };
    }

    generateTreeJSON(text: string): any {
        return this.generateBaseTreeJSON(text);
    }

    getValidationParams(obj: Object) {
        const params = {
            'minlength': 'minLength',
            'maxlength': 'maxLength'
        };
        let paramsArr = [];
        for (let param in obj) {
            if (obj.hasOwnProperty(param)) {
                paramsArr.push((params[param] || param) + ': ' + obj[param]);
            }
        }
        if (paramsArr.length) {
            return '.Validate(' + paramsArr.join(',') + ')';
        }
        return '';
    }

    getParams(obj: Object) {
        let paramsArr = [];
        for (let param in obj) {
            if (obj.hasOwnProperty(param)) {
                paramsArr.push(param + ': ' + (obj[param] || ''));
            }
        }
        return paramsArr.join(',');
    }

    hasEditProp(prop: string): boolean {
        return this.editProps.indexOf(prop) !== -1;
    }
}

export default Tag;