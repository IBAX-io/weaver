/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { useDrag, useDrop, DropTargetMonitor } from '@nosferatu500/react-dnd';
import resolveTagHandler from 'lib/constructor/tags';
import { TProtypoElement } from 'ibax/protypo';
import { ISourceElement } from 'ibax/editor';
import type { IEditableBlockProps } from './EditableBlock';

// Drag type shared by the palette (SourceElement), the canvas (Layout) and every constructor element
export const CONSTRUCTOR_DND_TYPE = 'element';

export interface IExistingTagDragItem {
    tag: TProtypoElement;
    dropEffect: string;
}

export type TConstructorDragItem = ISourceElement | IExistingTagDragItem;

interface IPoint {
    x: number;
    y: number;
}

function getGap(rect: DOMRect): IPoint {
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

function getTagObj(tag: TProtypoElement) {
    const Handler = resolveTagHandler(tag.tag);
    return Handler ? new Handler(tag) : null;
}

function getRectPosition(canHaveChildren: boolean, hoverClient: IPoint, gap: IPoint, hoverBoundingRect: DOMRect): string {
    let result = 'after';

    if (hoverClient.y < gap.y || hoverClient.x < gap.x) {
        return 'before';
    }
    if (hoverClient.y > hoverBoundingRect.height - gap.y || hoverClient.x > hoverBoundingRect.width - gap.x) {
        return 'after';
    }
    if (canHaveChildren) {
        result = 'inside';
    }
    return result;
}

function getDropPosition(monitor: DropTargetMonitor<TConstructorDragItem>, dom: HTMLElement, tag: TProtypoElement) {
    // Determine rectangle on screen
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

    const tagObj = getTagObj(tag);

    if (!tagObj.canChangePosition && tagObj.canHaveChildren) {
        return 'inside';
    }

    return getRectPosition(tagObj.canHaveChildren, hoverClient, gap, hoverBoundingRect);
}

let hoverTimer: ReturnType<typeof setTimeout> = null;

function startHoverTimer() {
    if (hoverTimer) {
        return false;
    }
    hoverTimer = setTimeout(() => { hoverTimer = null; }, 200);
    return true;
}

// The drop effect ('move' or 'copy') is chosen by the control the user grabbed in TagWrapper,
// which stores it in the data-dropeffect attribute of its root element
function readDropEffect(dom: HTMLElement) {
    const holder = dom && dom.querySelector('[data-dropeffect]');
    return (holder && holder.getAttribute('data-dropeffect')) || 'move';
}

export const isExistingTag = (item: TConstructorDragItem): item is IExistingTagDragItem =>
    'tag' in item && !!item.tag;

const isSameTag = (item: TConstructorDragItem, id: string): boolean =>
    isExistingTag(item) && !!item.tag.id && item.tag.id === id;

export default function dndComponent(Component: React.ComponentType<IEditableBlockProps>) {
    const DnDElement: React.FC<IEditableBlockProps> = (props) => {
        const nodeRef = React.useRef<HTMLElement>(null);
        const propsRef = React.useRef(props);
        React.useLayoutEffect(() => {
            propsRef.current = props;
        });

        const [{ isDragging }, drag, preview] = useDrag(() => ({
            type: CONSTRUCTOR_DND_TYPE,
            item: (): IExistingTagDragItem => ({
                tag: propsRef.current.tag,
                dropEffect: readDropEffect(nodeRef.current)
            }),
            collect: (monitor) => ({
                isDragging: monitor.isDragging()
            })
        }), []);

        const [{ isOver }, drop] = useDrop(() => ({
            accept: CONSTRUCTOR_DND_TYPE,
            drop: (droppedItem: TConstructorDragItem, monitor) => {
                const current = propsRef.current;

                if (monitor.didDrop() || isSameTag(droppedItem, current.tag.id)) {
                    return;
                }

                const position = getDropPosition(monitor, nodeRef.current, current.tag);

                if (!isExistingTag(droppedItem)) {
                    current.addTag({
                        tag: droppedItem,
                        destinationTagID: current.tag.id,
                        position
                    });
                    return;
                }

                const tagInfo = {
                    tag: droppedItem.tag,
                    destinationTagID: current.tag.id,
                    position
                };

                switch (droppedItem.dropEffect) {
                    case 'move':
                        current.moveTag(tagInfo);
                        break;
                    case 'copy':
                        current.copyTag(tagInfo);
                        break;
                    default:
                        break;
                }
            },
            hover: (droppedItem: TConstructorDragItem, monitor) => {
                if (!monitor.isOver({ shallow: true })) {
                    return;
                }
                if (!startHoverTimer()) {
                    return;
                }
                const current = propsRef.current;

                if (isSameTag(droppedItem, current.tag.id)) {
                    return;
                }
                current.setTagCanDropPosition({
                    position: getDropPosition(monitor, nodeRef.current, current.tag),
                    tagID: current.tag.id
                });
            },
            collect: (monitor) => ({
                isOver: monitor.isOver({ shallow: true })
            })
        }), []);

        const dndRef = React.useCallback((node: HTMLElement | null) => {
            nodeRef.current = node;
            drop(node);
            preview(node);
        }, [drop, preview]);

        return (
            <Component
                {...props}
                dndRef={dndRef}
                connectDragSource={drag}
                isOver={isOver}
                isDragging={isDragging}
            />
        );
    };

    return DnDElement;
}
