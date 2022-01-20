/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TProtypoElement } from 'ibax/protypo';
import { IFindTagResult } from 'ibax/editor';

class TreeSearch {
    private findTagByIdResult: IFindTagResult = {
        el: null,
        parent: null,
        parentPosition: 0,
        tail: false
    };

    public findTagById(elements: TProtypoElement[], id: string): IFindTagResult {
        this.findTagByIdResult.el = null;
        this.findNextTagInArrayById(elements, id, null, false);
        return this.findTagByIdResult;
    }

    private findNextTagById(el: any, id: string, parent: TProtypoElement, tail: boolean): void {
        if (el.id === id) {
            this.findTagByIdResult.el = el;
            return;
        }

        this.findNextTagInArrayById(el.children, id, el, false);
        this.findNextTagInArrayById(el.tail, id, el, true);
    }

    private findNextTagInArrayById(el: TProtypoElement[], id: string, parent: TProtypoElement, tail: boolean): void {
        for (var i = 0; el && i < el.length; i++) {
            if (this.findTagByIdResult.el) {
                break;
            }
            this.findTagByIdResult.parent = parent;
            this.findTagByIdResult.parentPosition = i;
            this.findTagByIdResult.tail = tail;
            this.findNextTagById(el[i], id, parent, false);
        }
    }
}

export default TreeSearch;