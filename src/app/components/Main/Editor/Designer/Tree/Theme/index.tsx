/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeProps } from '@nosferatu500/react-sortable-tree';
import nodeContentRenderer from './node-content-renderer';
import treeNodeRenderer from './tree-node-renderer';

// The tree theme no longer carries the row height, it is a prop of the tree itself
export const TREE_ROW_HEIGHT = 25;

const treeTheme: ThemeProps = {
  nodeContentRenderer,
  treeNodeRenderer,
  scaffoldBlockPxWidth: 25
};

export default treeTheme;
