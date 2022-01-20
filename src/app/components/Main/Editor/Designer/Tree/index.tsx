/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import {
  SortableTreeWithoutDndContext as SortableTree,
  ReactSortableTreeProps
} from 'react-sortable-tree';

interface IMySortableTreeProps extends ReactSortableTreeProps {
  theme?: any;
}

const TreeWrapper = styled.div`
  height: 100%;
  .tree-node {
    min-width: 100%;
    position: relative;
    padding-left: 30px;
  }

  .tree-node.selected {
    background-color: #61b2fe;
  }

  .tree-rowWrapper {
    height: 100%;
    box-sizing: border-box;
    cursor: move;
  }

  .tree-rowWrapper:hover {
    opacity: 0.7;
  }

  .tree-rowWrapper:active {
    opacity: 1;
  }

  .tree-rowWrapperDragDisabled {
    cursor: default;
  }

  .tree-row {
    height: 100%;
    white-space: nowrap;
    display: flex;
    position: relative;
  }

  .tree-row > * {
    box-sizing: border-box;
  }

  .tree-rowLandingPad,
  .tree-rowCancelPad {
    border: none;
    box-shadow: none;
    outline: none;
  }

  .tree-rowLandingPad *,
  .tree-rowCancelPad * {
    opacity: 0 !important;
  }

  .tree-rowLandingPad::before,
  .tree-rowCancelPad::before {
    background-color: lightblue;
    border: 2px dotted black;
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
  }

  .tree-rowCancelPad::before {
    background-color: #e6a8ad;
  }

  .tree-rowSearchMatch {
    box-shadow: inset 0 -7px 7px -3px #0080ff;
  }

  .tree-rowSearchFocus {
    box-shadow: inset 0 -7px 7px -3px #fc6421;
  }

  .tree-rowContents {
    display: inline-block;
    vertical-align: middle;
    position: relative;
    height: 100%;
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tree-rowLabel {
    display: inline-block;
    vertical-align: middle;
    flex: 0 1 auto;
    padding-right: 20px;
  }

  .tree-rowTitle {
    color: #fff;
  }

  .tree-rowSubtitle {
    color: #ccc;
  }

  .tree-rowToolbar {
    display: inline-block;
    vertical-align: middle;
    flex: 0 1 auto;
    display: flex;
  }

  .tree-toolbarButton {
    display: inline-block;
    vertical-align: middle;
  }

  .tree-collapseButton,
  .tree-expandButton {
    appearance: none;
    border: none;
    background: transparent;
    padding: 0;
    padding-left: 55px;
    z-index: 2;
    position: absolute;
    top: 45%;
    width: 30px;
    height: 30px;
    transform: translate3d(-50%, -50%, 0);
    cursor: pointer;
  }

  .tree-expandButton {
    top: 30%;
  }

  .tree-collapseButton::after,
  .tree-expandButton::after {
    content: '';
    position: absolute;
    transform-origin: 7px 4px;
    transform: translate3d(-50%, -20%, 0);
    border: solid transparent 7px;
    border-left-width: 5px;
    border-right-width: 5px;
    /* border-top-color: #8399b0; */
    border-top-color: #fff;
  }

  .tree-collapseButton:hover::after,
  .tree-expandButton:hover::after {
    border-top-color: #fff;
  }

  .tree-collapseButton:focus,
  .tree-expandButton:focus {
    outline: none;
  }

  .tree-expandButton::after {
    transform: translate3d(-50%, -20%, 0) rotateZ(-90deg);
  }

  .tree-lineChildren {
    height: 100%;
    display: inline-block;
  }

  .tree-button-remove {
    background: none;
    border: none;
    padding: 0;
    font-size: 20px;
    line-height: 23px;
  }

  .tree-lineBlock,
  .tree-absoluteLineBlock {
    height: 100%;
    position: relative;
    display: inline-block;
    flex: 0 0 auto;
  }

  .tree-absoluteLineBlock {
    position: absolute;
    top: 0;
  }

  .tree-highlightLineVertical {
    z-index: 3;
  }

  .tree-highlightLineVertical::before {
    position: absolute;
    content: '';
    background-color: #36c2f6;
    width: 6px;
    margin-left: -3px;
    left: 50%;
    top: 0;
    height: 100%;
  }

  .tree-highlightLineVertical::after {
    content: '';
    position: absolute;
    height: 0;
    margin-left: -3px;
    left: 50%;
    top: 0;
    border-left: 3px solid transparent;
    border-right: 3px solid transparent;
    border-top: 3px solid white;
    animation: arrow-pulse 1s infinite linear both;
  }

  .tree-highlightTopLeftCorner::before {
    z-index: 3;
    content: '';
    position: absolute;
    border-top: solid 6px #36c2f6;
    border-left: solid 6px #36c2f6;
    box-sizing: border-box;
    height: calc(50% + 3px);
    top: 50%;
    margin-top: -3px;
    right: 0;
    width: calc(50% + 3px);
  }

  .tree-highlightBottomLeftCorner {
    z-index: 3;
  }

  .tree-highlightBottomLeftCorner::before {
    content: '';
    position: absolute;
    border-bottom: solid 6px #36c2f6;
    border-left: solid 6px #36c2f6;
    box-sizing: border-box;
    height: calc(100% + 3px);
    top: 0;
    right: 7px;
    width: calc(50% - 4px);
  }

  .tree-highlightBottomLeftCorner::after {
    content: '';
    position: absolute;
    height: 0;
    right: 0;
    top: 100%;
    margin-top: -7px;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    border-left: 7px solid #36c2f6;
  }
`;

const MySortableTree: React.SFC<IMySortableTreeProps> = (props) => (
  <TreeWrapper>
    <SortableTree {...props} />
  </TreeWrapper>
);

export default MySortableTree;
