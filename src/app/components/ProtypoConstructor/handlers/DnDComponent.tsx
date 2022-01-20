/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { DropTarget, DragSource } from 'react-dnd';
import resolveTagHandler from 'lib/constructor/tags';
import { TProtypoElement } from 'ibax/protypo';

interface IRect {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

interface IPoint {
    x: number;
    y: number;
}

function getGap(rect: IRect): IPoint {
    const maxGap: number = 15;
    let gapX: number = rect.width / 4;
    let gapY: number = rect.height / 4;
    if (gapX > maxGap) {
        gapX = maxGap;
    }
    if (gapY > maxGap) {
        gapY = maxGap;
    }
    return {
        x: gapX,
        y: gapY
    };
}

function getTagObj(tag: TProtypoElement): any {
    let tagObj: any = null;
    const Handler = resolveTagHandler(tag.tag);
    if (Handler) {
        tagObj = new Handler(tag);
    }
    return tagObj;
}

function getRectPosition(tagObj: any, hoverClient: IPoint, gap: IPoint, hoverBoundingRect: IRect): string {
    let result = 'after';

    if (hoverClient.y < gap.y || hoverClient.x < gap.x) {
        return 'before';
    }
    if (hoverClient.y > hoverBoundingRect.height - gap.y || hoverClient.x > hoverBoundingRect.width - gap.x) {
        return 'after';
    }
    if (tagObj.canHaveChildren) {
        result = 'inside';
    }
    return result;
}

function getDropPosition(monitor: any, component: any, tag: any) {
    // Determine rectangle on screen
    const dom = findDOMNode(component);
    if (!dom) {
        return 'after';
    }
    const hoverBoundingRect = dom.getBoundingClientRect();

    const gap = getGap(hoverBoundingRect);

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClient: IPoint = {
        x: clientOffset.x - hoverBoundingRect.left,
        y: clientOffset.y - hoverBoundingRect.top
    };

    let tagObj = getTagObj(tag);

    if (!tagObj.canChangePosition && tagObj.canHaveChildren) {
        return 'inside';
    }

    return getRectPosition(tagObj, hoverClient, gap, hoverBoundingRect);
}

let hoverTimer: any = null;

function startHoverTimer() {
    if (hoverTimer) {
        return false;
    }
    hoverTimer = setTimeout(() => { hoverTimer = null; }, 200);
    return true;
}

const Source = {
    beginDrag(props: any, monitor: any, component: any) {
        let dropEffect = 'move';
        const el = findDOMNode(component);
        if (el) {
            const re = /data\-dropeffect="([a-z]+)"/i;
            const res = el && el.innerHTML.match(re);
            if (res) {
                dropEffect = res[1];
            }
        }
        return {
            tag: props.tag,
            dropEffect
        };
    }
};

const isSameTag = (droppedItem: any, id: string): boolean => {
    return droppedItem.tag && droppedItem.tag.id && droppedItem.tag.id === id;
};

const Target = {
    drop(props: any, monitor: any, component: any) {
        const droppedItem = monitor.getItem();

        if (monitor.didDrop() || isSameTag(droppedItem, props.tag.id)) {
            return;
        }

        const position = getDropPosition(monitor, component, props.tag);

        let tagInfo = {
            tag: droppedItem,
            destinationTagID: props.tag.id,
            position: position
        };

        if (droppedItem.new) {
            props.addTag(tagInfo);
            return;
        }

        tagInfo.tag = droppedItem.tag;

        switch (droppedItem.dropEffect) {
            case 'move':
                props.moveTag(tagInfo);
                break;
            case 'copy':
                props.copyTag(tagInfo);
                break;
            default:
                break;
        }
    },
    hover(props: any, monitor: any, component: any) {
        if (!monitor.isOver({ shallow: true })) {
            return;
        }
        if (!startHoverTimer()) {
            return;
        }
        const droppedItem = monitor.getItem();

        if (isSameTag(droppedItem, props.tag.id)) {
            return;
        }
        props.setTagCanDropPosition({ position: getDropPosition(monitor, component, props.tag), tagID: props.tag.id });
    }
};

function collectSource(connect: any, monitor: any) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    };
}

function collectTarget(connect?: any, monitor?: any) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver({ shallow: true })
    };
}

const ItemTypes = {
    SOURCE: 'element'
};

type TComponentConstructor<T> = React.ComponentClass<T> | React.SFC<T>;

export default function dndComponent<T>(Component: TComponentConstructor<T>) {
    return DragSource<T>(ItemTypes.SOURCE, Source, collectSource)(
        DropTarget<T>(ItemTypes.SOURCE, Target, collectTarget)(Component)
    );
}