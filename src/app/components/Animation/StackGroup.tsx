/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import Transition from 'react-transition-group/Transition';
import TransitionGroup from 'react-transition-group/TransitionGroup';

const animationDuration = 300;
const animationDef = {
  defaultStyle: {
    transform: 'translateX(0)',
    transition: `transform ${animationDuration}ms cubic-bezier(0,0,0,1),opacity ${animationDuration}ms`,
    opacity: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  },
  entering: {
    transform: 'translateX(-50px)',
    opacity: 0
  },
  entered: {
    transform: 'translateX(0)',
    opacity: 1
  },
  exiting: {
    transform: 'translateX(-50px)',
    opacity: 0
  },
  exited: {
    display: 'none'
  }
};

const Fade: React.SFC<{ in?: boolean }> = (props) => (
  <Transition in={props.in} timeout={{ enter: 0, exit: animationDuration }}>
    {(state: string) => (
      <div style={{ ...animationDef.defaultStyle, ...animationDef[state] }}>
        {props.children}
      </div>
    )}
  </Transition>
);

export interface IStackGroupProps {
  items: JSX.Element[];
}

const StackGroup: React.SFC<IStackGroupProps> = (props) => (
  <TransitionGroup>
    {props.items.map((item, index) => (
      <Fade key={index}>{item}</Fade>
    ))}
  </TransitionGroup>
);

export default StackGroup;
