/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import ProtypoConstructor from 'containers/Widgets/ProtypoConstructor';
import Layout from './Layout';

import TabView from 'components/TabView';

import SourceElements from './SourceElements';
import Properties from './Properties';
import Switch from './Switch';
import Tree from './Tree';

import TreeTheme from './Tree/Theme';

import imgGrid from 'images/constructor/grid.png';

interface IConstructorProps {
  section: string;
  pageTree: any;
  treeData: any;
  page?: any;
  pageTemplate: string;
  changePage?: any;
  setTagCanDropPosition?: any;
  selectTag?: any;
  addTag?: any;
  moveTag?: any;
  moveTreeTag?: any;
  copyTag?: any;
  removeTag?: any;
  selectedTag?: any;
  grid: boolean;
  logic: boolean;
  toggleGrid: any;
  toggleLogic: any;
  undo?: any;
  redo?: any;
  canUndo: boolean;
  canRedo: boolean;

  menus?: { id: string; name: string; conditions: string; value: string }[];
  onSave?: (block: string, error?: { type: string; error: string }) => void;
  canSave?: boolean;
}

interface IConstructorState {
  treeData: any;
}

const ConstructorDiv = styled.div`
  min-height: 300px;
  position: relative;
  height: 100%;

  .g-fullheight {
    height: 100%;
  }

  .left-panel {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 286px;
    height: 100%;
  }

  .left-panel__tab {
    flex: 1 1;
    overflow-y: auto;
  }

  .right-panel {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 286px;
    height: 100%;
  }

  .right-panel__scrollable {
    height: 100%;
    overflow-y: auto;
  }

  .center-panel {
    margin: 0 286px 0 286px;
    height: 100%;
  }

  .b-constructor-layout {
    padding: 12px 20px;
    flex: 1 1;
    overflow-y: auto;
    overflow-x: hidden;
    border-left: 1px solid #b1b1b1;
    border-right: 1px solid #b1b1b1;
    background-repeat: repeat;
  }

  .b-constructor-layout_grid {
    background-image: url(${imgGrid});
  }

  .b-constructor-layout_can-drop {
    background-color: rgba(150, 190, 255, 0.3);
  }

  [class^='site-icon-']:before,
  [class*=' site-icon-']:before {
    font-family: 'Site Icons';
    font-style: normal;
    font-weight: normal;
    speak: none;

    display: inline-block;
    text-decoration: inherit;
    width: 1em;
    margin-right: 0.2em;
    text-align: center;

    font-variant: normal;
    text-transform: none;

    line-height: 1em;

    margin-left: 0.2em;

    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .site-icon_big {
    font-size: 120%;
  }

  .site-icon-undo:before {
    content: '\\e800';
  }
  .site-icon-redo:before {
    content: '\\e801';
  }

  .btn-container,
  .btn-container:hover,
  .btn-container:active {
    background: transparent;
    padding: 0;
    margin: 0;
    border: none;
  }

  .btn-container_active {
    cursor: pointer;
    color: #ffffff;
  }

  .btn-container_disabled {
    cursor: default;
    color: #455568;
  }

  .editable {
    border: 1px dashed #7799ff;
  }

  .can-drop {
    background-color: rgba(150, 190, 255, 0.3);
    padding: 10px;
  }

  .can-drop.can-drop_before {
    border-top: 1px dashed blue;
    border-left: 1px dashed blue;
    background-color: rgba(150, 190, 255, 0.3);
  }

  .can-drop.can-drop_after {
    border-bottom: 1px dashed blue;
    border-right: 1px dashed blue;
    background-color: rgba(150, 190, 255, 0.3);
  }

  .b-icon-group {
    margin: 0 10px;
  }

  .b-switch {
    display: inline-block;
    min-width: 30px;
    height: 18px;
    cursor: pointer;
  }

  .b-switch > span {
    padding: 0 5px;
    vertical-align: middle;
  }

  .b-instrument-panel {
    min-height: 34px;
    background-color: #465669;
  }

  .b-instrument-panel__inner {
    padding: 4px;
  }

  .b-instrument-panel__inner_dark {
    background-color: #465669;
  }

  .b-panel-light {
    background-color: #707c91;
    color: #fff;
  }

  .b-panel-light input {
    background-color: #354454;
    border-color: #4c6073;
    color: #fff;
  }

  .b-panel-light input[readonly] {
    background-color: #354454;
    border-color: #4c6073;
    color: #aaa;
  }

  .g-no-padding {
    padding: 0;
  }

  .g-padding-bottom {
    padding-bottom: 10px;
  }
`;

class Constructor extends React.Component<
  IConstructorProps,
  IConstructorState
> {
  constructor(props: IConstructorProps) {
    super(props);
    this.state = {
      treeData: props.treeData
    };
  }
  componentWillReceiveProps(props: IConstructorProps) {
    if (this.state.treeData !== props.treeData) {
      this.setState({
        treeData: props.treeData
      });
    }
  }
  render() {
    return (
      <ConstructorDiv>
        <div className="left-panel">
          <TabView
            className="p0 b0 flex-stretch"
            wrapperClassName="g-fullheight flex-col"
            paneClassName="g-fullheight"
            tabsClassName="nav-tabs-dark nav-justified"
            tabs={['Objects', 'Search', 'Tree']}
          >
            <SourceElements search={false} />
            <SourceElements search={true} />
            <Tree
              treeData={this.state.treeData}
              onChange={(treeData: any) => {
                this.setState({ treeData });
              }}
              onMoveNode={(args) => {
                this.props.moveTreeTag({
                  treeData: this.state.treeData,
                  tagID: args.node.id
                });
              }}
              scaffoldBlockPxWidth={10}
              canDrag={(node: any) => {
                return node.node.canMove;
              }}
              canDrop={(node: any) => {
                return node.nextParent ? node.nextParent.canDrop : true;
              }}
              innerStyle={{
                padding: '15px 0',
                backgroundColor: '#465669',
                color: '#FFFFFF'
              }}
              theme={TreeTheme}
              generateNodeProps={({ node, path }) => ({
                title: (
                  <span
                    onClick={() => {
                      this.props.selectTag(node.tag);
                    }}
                  >
                    {node.title}
                  </span>
                ),
                buttons: [
                  <button
                    key={node.tag && node.tag.id}
                    className="tree-button-remove"
                    onClick={() => {
                      this.props.removeTag({ tag: node.tag });
                    }}
                  >
                    &times;
                  </button>
                ]
              })}
            />
          </TabView>
        </div>
        <div className="center-panel flex-col">
          <div className="b-instrument-panel b-panel-light">
            <div className="b-instrument-panel__inner pull-left">
              <button
                className={
                  this.props.canUndo
                    ? 'btn-container btn-container_active'
                    : 'btn-container btn-container_disabled'
                }
                onClick={this.props.undo}
              >
                <i className="site-icon-undo site-icon_big" />
              </button>
              <button
                className={
                  this.props.canRedo
                    ? 'btn-container btn-container_active'
                    : 'btn-container btn-container_disabled'
                }
                onClick={this.props.redo}
              >
                <i className="site-icon-redo site-icon_big" />
              </button>
            </div>
            <div className="b-instrument-panel__inner pull-right">
              <div className="b-icon-group pull-left">
                <div className="b-switch">
                  <span>GRID</span>
                  <Switch
                    initialValue={this.props.grid ? 'grid' : ''}
                    onValue="grid"
                    offValue=""
                    onChange={this.props.toggleGrid}
                  />
                </div>
                <div className="b-switch">
                  <span>LOGIC</span>
                  <Switch
                    initialValue={this.props.logic ? 'logic' : ''}
                    onValue="logic"
                    offValue=""
                    onChange={this.props.toggleLogic}
                  />
                </div>
              </div>
            </div>
          </div>

          <Layout
            grid={this.props.grid}
            addTag={this.props.addTag}
            moveTag={this.props.moveTag}
            copyTag={this.props.copyTag}
          >
            <ProtypoConstructor
              section={this.props.section}
              context="page"
              content={this.props.pageTree}
              editable={true}
              changePage={this.props.changePage}
              setTagCanDropPosition={this.props.setTagCanDropPosition}
              selectTag={this.props.selectTag}
              addTag={this.props.addTag}
              moveTag={this.props.moveTag}
              copyTag={this.props.copyTag}
              removeTag={this.props.removeTag}
              selectedTag={this.props.selectedTag}
              logic={this.props.logic}
            />
          </Layout>
        </div>
        <div className="right-panel flex-col">
          <div className="flex-stretch right-panel__scrollable">
            <Properties
              tag={this.props.selectedTag}
              changePage={this.props.changePage}
            />
          </div>
        </div>
      </ConstructorDiv>
    );
  }
}

export default Constructor;
