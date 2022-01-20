/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { DragSource } from 'react-dnd';

const ItemTypes = {
  SOURCE: 'element'
};

const Source = {
  beginDrag(props: ISourceElementProps) {
    return {
      new: true,
      element: props.element,
      template: props.template,
      text: props.text
    };
  }
};

function collect(connect: any, monitor: any) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

interface ISourceElementProps {
  text: string;
  element?: string;
  template?: string;
  connectDragSource?: any;
  connectDragPreview?: any;
  isDragging?: boolean;
}

interface ISourceElementState {
  collapsed: boolean;
}

class SourceElement extends React.Component<
  ISourceElementProps,
  ISourceElementState
> {
  constructor(props: ISourceElementProps) {
    super(props);
  }
  render() {
    const { connectDragSource, connectDragPreview, isDragging } = this.props;
    return connectDragPreview(
      connectDragSource(
        <li>
          {this.props.text} {isDragging ? '' : ''}
        </li>
      ),
      { offsetY: -10 }
    );
  }
}

// export default SourceElement;
export default DragSource(ItemTypes.SOURCE, Source, collect)(SourceElement);
