/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import classnames from 'classnames';
import { useDrop } from '@nosferatu500/react-dnd';
import { IAddTagCall, IOperateTagCall } from 'ibax/editor';
import {
  CONSTRUCTOR_DND_TYPE,
  TConstructorDragItem,
  isExistingTag
} from 'components/ProtypoConstructor/handlers/DnDComponent';

interface ILayoutProps {
  grid: boolean;
  addTag?: (payload: IAddTagCall) => void;
  moveTag?: (payload: IOperateTagCall) => void;
  copyTag?: (payload: IOperateTagCall) => void;
}

const Layout: React.FC<React.PropsWithChildren<ILayoutProps>> = (props) => {
  const propsRef = React.useRef(props);
  React.useLayoutEffect(() => {
    propsRef.current = props;
  });

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: CONSTRUCTOR_DND_TYPE,
      drop: (droppedItem: TConstructorDragItem, monitor) => {
        if (monitor.didDrop()) {
          return;
        }
        const current = propsRef.current;

        if (!isExistingTag(droppedItem)) {
          current.addTag({
            tag: droppedItem
          });
          return;
        }

        switch (droppedItem.dropEffect) {
          case 'move':
            current.moveTag({
              tag: droppedItem.tag
            });
            break;
          case 'copy':
            current.copyTag({
              tag: droppedItem.tag
            });
            break;
          default:
            break;
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true })
      })
    }),
    []
  );

  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      drop(node);
    },
    [drop]
  );

  const classes = classnames({
    'b-constructor-layout': true,
    'b-constructor-layout_grid': props.grid,
    'b-constructor-layout_can-drop': isOver
  });

  return (
    <div ref={ref} className={classes}>
      {props.children}
    </div>
  );
};

export default Layout;
