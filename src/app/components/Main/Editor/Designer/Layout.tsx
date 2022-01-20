/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as classnames from 'classnames';
import { DropTarget } from 'react-dnd';

const layoutTarget = {
  drop(props: ILayoutProps, monitor: any) {
    if (monitor.didDrop()) {
      return;
    }
    const droppedItem = monitor.getItem();

    if (droppedItem.new) {
      props.addTag({
        tag: droppedItem
      });
    } else {
      switch (droppedItem.dropEffect) {
        case 'move':
          props.moveTag({
            tag: droppedItem.tag
          });
          break;
        case 'copy':
          props.copyTag({
            tag: droppedItem.tag
          });
          break;
        default:
          break;
      }
    }
  }
};

function collect(connect?: any, monitor?: any) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver({ shallow: true })
  };
}

const ItemTypes = {
  SOURCE: 'element'
};

interface ILayoutProps {
  grid: boolean;
  connectDropTarget?: any;
  isOver?: boolean;
  addTag?: any;
  moveTag?: any;
  copyTag?: any;
}

interface ILayoutState {}

class Layout extends React.Component<ILayoutProps, ILayoutState> {
  constructor(props: ILayoutProps) {
    super(props);
  }
  render() {
    const { connectDropTarget, isOver } = this.props;

    const classes = classnames({
      'b-constructor-layout': true,
      'b-constructor-layout_grid': this.props.grid,
      'b-constructor-layout_can-drop': isOver
    });

    return connectDropTarget(
      <div className={classes}>{this.props.children}</div>
    );
  }
}

export default DropTarget(ItemTypes.SOURCE, layoutTarget, collect)(Layout);
