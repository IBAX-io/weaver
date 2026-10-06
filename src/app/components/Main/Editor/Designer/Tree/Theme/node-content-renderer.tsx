/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { ConnectDragPreview, ConnectDragSource } from '@nosferatu500/react-dnd';
import { NodeData, TreeItem } from '@nosferatu500/react-sortable-tree';
import { TConstructorTreeElement } from 'ibax/editor';

type TTreeNode = TreeItem<TConstructorTreeElement>;

function isDescendant(older: TTreeNode, younger: TTreeNode): boolean {
  return (
    !!older.children &&
    typeof older.children !== 'function' &&
    older.children.some(
      (child: TTreeNode) => child === younger || isDescendant(child, younger)
    )
  );
}

// Props injected by the tree row (scaffold/swap data is cloned in by the tree node renderer)
export interface IFileThemeNodeContentRendererProps {
  scaffoldBlockPxWidth: number;
  toggleChildrenVisibility?: (data: NodeData<TConstructorTreeElement>) => void;
  connectDragPreview: ConnectDragPreview;
  connectDragSource: ConnectDragSource;
  isDragging: boolean;
  canDrop?: boolean;
  canDrag?: boolean;
  node: TTreeNode;
  title?: React.ReactNode | ((data: NodeData<TConstructorTreeElement>) => React.ReactNode);
  draggedNode?: TTreeNode;
  path: number[];
  treeIndex: number;
  isSearchMatch?: boolean;
  isSearchFocus?: boolean;
  icons?: React.ReactNode[];
  buttons?: React.ReactNode[];
  className?: string;
  style?: React.CSSProperties;
  didDrop?: boolean;
  lowerSiblingCounts?: number[];
  listIndex?: number;
  swapFrom?: number;
  swapLength?: number;
  swapDepth?: number;
}

const FileThemeNodeContentRenderer: React.FC<IFileThemeNodeContentRendererProps> = ({
  scaffoldBlockPxWidth,
  toggleChildrenVisibility = null,
  connectDragPreview,
  connectDragSource,
  isDragging,
  canDrop = false,
  canDrag = false,
  node,
  title = null,
  draggedNode = null,
  path,
  treeIndex,
  isSearchMatch = false,
  isSearchFocus = false,
  icons = [],
  buttons = [],
  className = '',
  style = {},
  didDrop,
  lowerSiblingCounts = [],
  listIndex,
  swapFrom = null,
  swapLength = null,
  swapDepth = null
}) => {
  const dragSourceRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      connectDragSource(element, { dropEffect: 'copy' });
    },
    [connectDragSource]
  );

  const nodeTitle = title || node.title;
  const nodeSubtitle = node.subtitle ? ' ' + node.subtitle : '';

  const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
  const isLandingPadActive = !didDrop && isDragging;

  // Construct the scaffold representing the structure of the tree
  const scaffold: React.ReactNode[] = [];

  lowerSiblingCounts.forEach((lowerSiblingCount, i) => {
    scaffold.push(
      <div
        key={`pre_${1 + i}`}
        style={{ width: scaffoldBlockPxWidth }}
        className="tree-lineBlock"
      />
    );

    if (treeIndex !== listIndex && i === swapDepth) {
      // This row has been shifted, and is at the depth of
      // the line pointing to the new destination
      let highlightLineClass = '';

      if (listIndex === swapFrom + swapLength - 1) {
        // This block is on the bottom (target) line
        // This block points at the target block (where the row will go when released)
        highlightLineClass = 'tree-highlightBottomLeftCorner';
      } else if (treeIndex === swapFrom) {
        // This block is on the top (source) line
        highlightLineClass = 'tree-highlightTopLeftCorner';
      } else {
        // This block is between the bottom and top
        highlightLineClass = 'tree-highlightLineVertical';
      }

      scaffold.push(
        <div
          key={`highlight_${1 + i}`}
          style={{
            width: scaffoldBlockPxWidth,
            left: scaffoldBlockPxWidth * i
          }}
          className={`tree-absoluteLineBlock ${highlightLineClass}`}
        />
      );
    }
  });

  const children = Array.isArray(node.children) ? node.children : [];

  return (
    <div style={{ height: '100%' }} ref={canDrag ? dragSourceRef : undefined}>
      {node.selected && (
        <div style={{ position: 'absolute', left: '10px', zIndex: 100 }}>
          {buttons.map((btn, index) => (
            <div key={index}>{btn}</div>
          ))}
        </div>
      )}
      {toggleChildrenVisibility && children.length > 0 && (
        <button
          type="button"
          aria-label={node.expanded ? 'Collapse' : 'Expand'}
          className={
            node.expanded ? 'tree-collapseButton' : 'tree-expandButton'
          }
          style={{
            left: (lowerSiblingCounts.length - 0.7) * scaffoldBlockPxWidth
          }}
          onClick={() =>
            toggleChildrenVisibility({
              node,
              path,
              treeIndex
            })
          }
        />
      )}
      <div
        className={
          'tree-rowWrapper' + (!canDrag ? ' tree-rowWrapperDragDisabled' : '')
        }
      >
        {/* Set the row preview to be used during drag and drop */}
        <div style={{ display: 'flex' }} ref={connectDragPreview}>
          {scaffold}
          <div
            className={
              'tree-row' +
              (isLandingPadActive ? ' tree-rowLandingPad' : '') +
              (isLandingPadActive && !canDrop ? ' tree-rowCancelPad' : '') +
              (isSearchMatch ? ' tree-rowSearchMatch' : '') +
              (isSearchFocus ? ' tree-rowSearchFocus' : '') +
              (className ? ` ${className}` : '')
            }
            style={{
              opacity: isDraggedDescendant ? 0.5 : 1,
              ...style
            }}
          >
            <div
              className={
                'tree-rowContents' +
                (!canDrag ? ' tree-rowContentsDragDisabled' : '')
              }
            >
              <div className="tree-rowToolbar">
                {icons.map((icon, index) => (
                  <div key={index} className="tree-toolbarButton">
                    {icon}
                  </div>
                ))}
              </div>
              <div className="tree-rowLabel">
                <span
                  className="tree-rowTitle"
                  style={{ color: node.logic ? '#FC6' : '#FFF' }}
                >
                  {typeof nodeTitle === 'function'
                    ? nodeTitle({
                        node,
                        path,
                        treeIndex
                      })
                    : nodeTitle}
                </span>
                <span className="tree-rowSubtitle">{nodeSubtitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileThemeNodeContentRenderer;
