/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import Transition from 'react-transition-group/Transition';

const animationDuration = 200;
const containerAnimationDef = {
  defaultStyle: {
    opacity: 1,
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 600
  },

  alignStyle: {
    left: { left: 0 },
    right: { right: 0 }
  },

  // Negative margins are used to mitigate padding that is used to
  // show the box-shadow. After animation completes we reset overflow
  // back to visible, so we don't need those again
  entering: {
    padding: '0 50px 50px',
    margin: '0 -50px',
    overflow: 'hidden'
  },
  entered: {
    overflow: 'visible'
  },

  // Same as 'entering'. Padding is used to correctly show the box-shadow
  exiting: {
    padding: '0 50px 50px',
    margin: '0 -50px',
    overflow: 'hidden',
    zIndex: 500
  }
};

const animationDef = {
  defaultStyle: {
    transition: `transform ${animationDuration}ms cubic-bezier(0,0.5,0.5,1), opacity ${animationDuration}ms`,
    transform: 'translateY(-25%)',
    marginTop: '0',
    opacity: 0
  },
  entering: {
    transform: 'translateY(0)',
    opacity: 1
  },
  entered: {
    transform: 'translateY(0)',
    opacity: 1
  },

  // We use negative margin to make children unclickable and not to break
  // animation that will be used later
  exited: {
    transform: 'translateY(-25%)',
    marginTop: '-100000px',
    opacity: 0
  }
};

export interface IDropdownProps {
  visible: boolean;
  align?: 'left' | 'right';
  width?: number;
}

const Dropdown: React.SFC<IDropdownProps> = (props) => (
  <Transition in={props.visible} timeout={animationDuration}>
    {(state: string) => (
      <div
        style={{
          ...containerAnimationDef.defaultStyle,
          ...containerAnimationDef[state],
          ...(props.align
            ? containerAnimationDef.alignStyle[props.align]
            : null)
        }}
      >
        <div
          style={{
            ...animationDef.defaultStyle,
            ...animationDef[state],
            width: props.width
          }}
        >
          {props.children}
        </div>
      </div>
    )}
  </Transition>
);

export default Dropdown;
