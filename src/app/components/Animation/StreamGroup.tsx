/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Transition, TransitionGroup, TransitionStatus } from 'react-transition-group';

const animationDuration = 300;
const animationDef = {
  defaultStyle: {
    transform: 'translateX(0)',
    transition: `transform ${animationDuration}ms cubic-bezier(0,0.5,0.5,1),opacity ${animationDuration}ms`,
    opacity: 1
  },
  entering: {
    transform: 'translateX(50px)',
    opacity: 0
  },
  entered: {
    transform: 'translateX(0)',
    opacity: 1
  },
  exiting: {
    transform: 'translateX(50px)',
    transition: `transform ${animationDuration}ms cubic-bezier(1,0.4,0.2,1),opacity ${animationDuration}ms`,
    opacity: 0
  },
  exited: {
    display: 'none'
  }
};

const Fade: React.FC<React.PropsWithChildren<{ in?: boolean }>> = (props) => {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  return (
    <Transition nodeRef={nodeRef} in={props.in} timeout={{ enter: 0, exit: animationDuration }}>
      {(state: TransitionStatus) => (
        <div ref={nodeRef} style={{ ...animationDef.defaultStyle, ...animationDef[state] }}>
          {props.children}
        </div>
      )}
    </Transition>
  );
};

export interface IStreamGroupProps {
  items: {
    key: string;
    content: React.JSX.Element;
  }[];
}

const StreamGroup: React.FC<React.PropsWithChildren<IStreamGroupProps>> = (props) => (
  <TransitionGroup>
    {props.items.map((item) => (
      <Fade key={item.key}>{item.content}</Fade>
    ))}
  </TransitionGroup>
);

export default StreamGroup;
