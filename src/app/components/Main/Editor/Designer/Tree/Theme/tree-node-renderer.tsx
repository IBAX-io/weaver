/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { Children, cloneElement } from 'react';
import * as classnames from 'classnames';

interface IFileThemeTreeNodeRendererProps {
  children: any;
  listIndex: any;
  swapFrom: any;
  swapLength: any;
  swapDepth: any;
  scaffoldBlockPxWidth: any;
  lowerSiblingCounts: any;
  connectDropTarget: any;
  isOver: any;
  draggedNode: any;
  canDrop: any;
  treeIndex: any;
  treeId: any;
  getPrevRow: any;
  node: any;
  path: any;
}

const FileThemeTreeNodeRenderer: React.SFC<IFileThemeTreeNodeRendererProps> = (
  props
) => {
  const {
    children,
    listIndex,
    swapFrom = null,
    swapLength = null,
    swapDepth = null,
    scaffoldBlockPxWidth,
    lowerSiblingCounts,
    connectDropTarget,
    isOver,
    draggedNode = null,
    canDrop = false,
    treeIndex,
    treeId, // Delete from otherProps
    getPrevRow, // Delete from otherProps
    node, // Delete from otherProps
    path, // Delete from otherProps
    ...otherProps
  } = props;

  const classes = classnames({
    'tree-node': true,
    selected: node.selected
  });

  return connectDropTarget(
    <div {...otherProps} className={classes}>
      {Children.map(children, (child: any) =>
        cloneElement(child, {
          isOver,
          canDrop,
          draggedNode,
          lowerSiblingCounts,
          listIndex,
          swapFrom,
          swapLength,
          swapDepth
        })
      )}
    </div>
  );
};

export default FileThemeTreeNodeRenderer;
