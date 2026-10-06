/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { cloneElement, isValidElement } from 'react';
import classnames from 'classnames';
import { ConnectDropTarget } from '@nosferatu500/react-dnd';
import { TreeItem } from '@nosferatu500/react-sortable-tree';
import { TConstructorTreeElement } from 'ibax/editor';
import { IFileThemeNodeContentRendererProps } from './node-content-renderer';

type TTreeNode = TreeItem<TConstructorTreeElement>;

type TRowScaffoldProps = Pick<
  IFileThemeNodeContentRendererProps,
  | 'lowerSiblingCounts'
  | 'listIndex'
  | 'swapFrom'
  | 'swapLength'
  | 'swapDepth'
>;

// Row attributes the tree passes through to the row element (role, aria-*, tabIndex, data-rst-row)
type TRowElementProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'className' | 'style'
> & {
  'data-rst-row'?: number;
};

interface IFileThemeTreeNodeRendererProps extends TRowElementProps {
  children: React.ReactNode;
  listIndex: number;
  swapFrom?: number;
  swapLength?: number;
  swapDepth?: number;
  scaffoldBlockPxWidth: number;
  lowerSiblingCounts: number[];
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  draggedNode?: TTreeNode;
  canDrop?: boolean;
  treeIndex: number;
  treeId: string;
  rowHeight: number | ((treeIndex: number, node: TTreeNode, path: number[]) => number);
  rowDirection?: string;
  getPrevRow: () => unknown;
  node: TTreeNode;
  path: number[];
}

const FileThemeTreeNodeRenderer: React.FC<IFileThemeTreeNodeRendererProps> = ({
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
  treeId,
  rowHeight,
  rowDirection,
  getPrevRow,
  node,
  path,
  ...otherProps
}) => {
  const classes = classnames({
    'tree-node': true,
    selected: node.selected
  });

  // The rows are virtualized and measured, so the row element must carry its own height
  const height =
    typeof rowHeight === 'function' ? rowHeight(treeIndex, node, path) : rowHeight;

  const scaffoldProps: TRowScaffoldProps & {
    isOver: boolean;
    canDrop: boolean;
    draggedNode: TTreeNode;
  } = {
    isOver,
    canDrop,
    draggedNode,
    lowerSiblingCounts,
    listIndex,
    swapFrom,
    swapLength,
    swapDepth
  };

  return (
    <div
      {...otherProps}
      ref={connectDropTarget}
      className={classes}
      style={{ height }}
    >
      {isValidElement<TRowScaffoldProps>(children)
        ? cloneElement(children, scaffoldProps)
        : children}
    </div>
  );
};

export default FileThemeTreeNodeRenderer;
