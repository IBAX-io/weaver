/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

function isDescendant(older: any, younger: any) {
  return (
    !!older.children &&
    typeof older.children !== 'function' &&
    older.children.some(
      (child: any) => child === younger || isDescendant(child, younger)
    )
  );
}

interface IFileThemeNodeContentRendererProps {
  scaffoldBlockPxWidth: any;
  toggleChildrenVisibility: any;
  onSelect?: any;
  connectDragPreview: any;
  connectDragSource: any;
  isDragging: any;
  canDrop: any;
  canDrag: any;
  node: any;
  title: any;
  draggedNode: any;
  path: any;
  treeIndex: any;
  isSearchMatch: any;
  isSearchFocus: any;
  icons: any;
  buttons: any;
  className: any;
  style: any;
  didDrop: any;
  lowerSiblingCounts: any;
  listIndex: any;
  swapFrom: any;
  swapLength: any;
  swapDepth: any;
  treeId: any;
  isOver: any;
  parentNode: any;
}

const FileThemeNodeContentRenderer: React.SFC<IFileThemeNodeContentRendererProps> = (
  props
) => {
  const {
    scaffoldBlockPxWidth,
    toggleChildrenVisibility = null,
    onSelect = null,
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
    lowerSiblingCounts,
    listIndex,
    swapFrom = null,
    swapLength = null,
    swapDepth = null,
    treeId, // Not needed, but preserved for other renderers
    isOver, // Not needed, but preserved for other renderers
    parentNode = null, // Needed for dndManager
    ...otherProps
  } = props;

  const nodeTitle = title || node.title;
  const nodeSubtitle = node.subtitle ? ' ' + node.subtitle : '';

  const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
  const isLandingPadActive = !didDrop && isDragging;

  // Construct the scaffold representing the structure of the tree
  const scaffold: any = [];

  lowerSiblingCounts.forEach((lowerSiblingCount: any, i: number) => {
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

  const nodeContent = (
    <div style={{ height: '100%' }} {...otherProps}>
      {node.selected && (
        <div style={{ position: 'absolute', left: '10px', zIndex: 100 }}>
          {buttons.map((btn: any, index: number) => (
            <div key={index}>{btn}</div>
          ))}
        </div>
      )}
      {toggleChildrenVisibility && node.children && node.children.length > 0 && (
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
        {connectDragPreview(
          <div style={{ display: 'flex' }}>
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
                  {icons.map((icon: any, index: number) => (
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
        )}
      </div>
    </div>
  );

  return canDrag
    ? connectDragSource(nodeContent, { dropEffect: 'copy' })
    : nodeContent;
};

export default FileThemeNodeContentRenderer;
