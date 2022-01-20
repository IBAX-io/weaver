/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TProtypoElement } from 'ibax/protypo';
import { IFindTagResult, TConstructorTreeElement } from 'ibax/editor';
import * as _ from 'lodash';
import { html2json } from 'html2json';
import resolveTagHandler from './tags';
import IdGenerator from './idGenerator';
import { htmlJsonChild2childrenTags, stripNewlineTags } from './helpers';
import TreeSearch from './treeSearch';
import Tag from './tags/Tag';

export const findTagById = (el: TProtypoElement[], id: string): IFindTagResult => {
    const treeSearch = new TreeSearch();
    return treeSearch.findTagById(el, id);
};

// todo: copyArray, copyObject

function copyObjectInstance(item: any) {
    let result = null;
    if (item instanceof Object && !(item instanceof Function)) {
        result = {};
        for (const key of Object.keys(item)) {
        // for (let key in item) {
            result[key] = copyObject(item[key]);
        }
    }
    return result;
}

export function copyObject(item: any) {
    let result: any = null;
    if (!item) {
        return result;
    }
    if (Array.isArray(item)) {
        result = item.map(copyObject);
    }
    else {
        result = copyObjectInstance(item);
    }
    return result || item;
}

export const idGenerator = new IdGenerator();

function setId(tag: any, force: boolean) {
    if (force) {
        tag.id = idGenerator.generateId();
    }
    else {
        tag.id = tag.id || idGenerator.generateId();
    }
}

export function setIds(children: any[], force: boolean = false) {
    for (let tag of children) {
        if (!tag) {
            continue;
        }
        setId(tag, force);
        setIds(tag.children || [], force);
        setIds(tag.tail || [], force);
    }
}

function isFirstChildText(item: TProtypoElement): boolean {
    return item.children && item.children.length && item.children[0] && item.children[0].tag === 'text';
}

function getTailTreeItem(tail: TProtypoElement[], selectedTag?: TProtypoElement): TConstructorTreeElement {
    const children = convertToTreeData(tail, selectedTag);
    return {
        title: '...',
        children: children.length && children || null,
        expanded: true,
        id: '',
        selected: false,
        logic: true,
        canMove: false,
        canDrop: false,
        tag: null
    };
}

function getChildrenTreeItems(item: TProtypoElement, selectedTag?: TProtypoElement): TConstructorTreeElement[] {
    let itemChildren = item.children;
    if (isFirstChildText(item) && item.children.length > 0) {
        itemChildren = [...item.children.slice(1)];
    }
    return convertToTreeData(itemChildren, selectedTag);
}

function getTreeItemTitle(item: TProtypoElement): string {
    let subtitle = item.text;
    if (isFirstChildText(item)) {
        subtitle = _.truncate(item.children[0].text, {
            'length': 24,
            'separator': /,? +/
        });
    }
    return item.tag + (subtitle ? (': ' + subtitle) : '');
}

function getTreeItem(item: TProtypoElement, selectedTag?: TProtypoElement): TConstructorTreeElement {

    let children = getChildrenTreeItems(item, selectedTag);
    if (item.tail) {
        children.push(getTailTreeItem(item.tail, selectedTag));
    }

    let selected = selectedTag && selectedTag.id === item.id || false;

    const Handler = resolveTagHandler(item.tag);

    const tagObj = new Handler(item);
    return {
        title: getTreeItemTitle(item),
        children: children.length && children || null,
        expanded: true,
        id: item.id,
        selected: selected,
        logic: tagObj.logic,
        canMove: tagObj.canMove,
        canDrop: tagObj.canHaveChildren,
        tag: item
    };
}

export function convertToTreeData(data: TProtypoElement[], selectedTag?: TProtypoElement): TConstructorTreeElement[] {
    let result = [];

    for (const item of data || []) {
        let treeItem: TConstructorTreeElement = getTreeItem(item, selectedTag);
        if (treeItem) {
            result.push(treeItem);
        }
    }

    return result;
}

export default class CodeGenerator {
    private elements: TProtypoElement[];
    constructor(elements: TProtypoElement[]) {
        this.elements = elements;
    }
    render(): string {
        if (!this.elements) {
            return '';
        }
        let tag = new Tag(null);
        return tag.renderChildren(this.elements, -1);
    }
}

function getChildrenElements(children: TProtypoElement[]) {
    let result: TProtypoElement[] = [];
    for (let child of children) {
        result.push(updateElementChildrenText(child));
    }
    return result;
}

function updateElementChildrenText(el: TProtypoElement) {

    if (el.children) {
        let childrenText = null;
        const Handler = resolveTagHandler(el.tag);
        if (Handler) {
            let tag = new Handler(el);
            childrenText = tag.renderHTMLChildren();
        }
        return {
            ...el,
            childrenText,
            children: getChildrenElements(el.children)
        };
    }
    else {
        return el;
    }
}

export function updateChildrenText(tree: TProtypoElement[]): TProtypoElement[] {
    let updatedElements = [];
    if (tree && tree.length) {
        for (let el of tree) {
            updatedElements.push(updateElementChildrenText(el));
        }
        return updatedElements;
    }
    else {
        return tree;
    }
}

export function html2childrenTags(html: string): TProtypoElement[] {
    const htmlJson = html2json(stripNewlineTags(html));
    return htmlJsonChild2childrenTags(htmlJson.child);
}