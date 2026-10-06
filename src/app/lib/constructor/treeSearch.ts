/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IFindTagResult, ITreeNode } from 'ibax/editor';

// Works on both protypo elements and their tree-view projections: only id/children/tail are read.
// Each search returns a fresh result, so a miss never carries values over from a previous search.
class TreeSearch {
    public findTagById<T extends ITreeNode<T>>(elements: T[], id: string): IFindTagResult<T> {
        const result: IFindTagResult<T> = {
            el: null,
            parent: null,
            parentPosition: 0,
            tail: false
        };
        this.searchArray(elements, id, null, false, result);
        return result;
    }

    private searchNode<T extends ITreeNode<T>>(el: T, id: string, result: IFindTagResult<T>): void {
        if (el.id === id) {
            result.el = el;
            return;
        }

        this.searchArray(el.children, id, el, false, result);
        this.searchArray(el.tail, id, el, true, result);
    }

    private searchArray<T extends ITreeNode<T>>(elements: readonly T[] | null | undefined, id: string, parent: T | null, tail: boolean, result: IFindTagResult<T>): void {
        for (let i = 0; elements && i < elements.length; i++) {
            if (result.el) {
                return;
            }
            result.parent = parent;
            result.parentPosition = i;
            result.tail = tail;
            this.searchNode(elements[i], id, result);
        }
    }
}

export default TreeSearch;
