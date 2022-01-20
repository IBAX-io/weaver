/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import themed from 'components/Theme/themed';

interface Props {
  onFoldToggle: () => void;
  folded: boolean;
}

const styles = {
  // Active hover zone at each size
  hoverWidth: 11,

  // Visible border width
  borderSize: 2
};

const StyledResizeHandle = themed.button`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 15px;
    text-align: center;
    width: ${styles.hoverWidth * 2}px;
    outline: 0;
    border: 0;
    background: none;
    padding: 0;
    margin: 0;
    margin-left: ${-styles.hoverWidth}px;
    z-index: 105;
     box-shadow:-11px 0px 0px 0px rgba(0,0,0,0.06) inset, 11px 0px 0px 0px rgba(0,0,0,0.06) inset;
    &.disabled {
        cursor: default;
    }
    
    > div {
        position: absolute;
        top: 0;
        bottom: 0;
        left: ${styles.hoverWidth - styles.borderSize / 2}px;
        margin: 0;
        width: ${styles.borderSize}px;
        transition: background .16s;
    }
     &>div{
       position:relative;
     }
     &>div>i{
      position:absolute;
      top:50%;
      left:-10px;
      font-size:20px;
      animation:myright 2s linear 1s infinite alternate;
      opacity:0.8;
     }
     @keyframes myright
     {
      from {left:2px;opacity:0;}
      to {-10px;opacity:1;}
    }
    &:hover > div {
        background: ${(props) => props.theme.menuBorder};
    }
`;

const ResizeHandle: React.SFC<Props> = (props) => {
  console.log(props);
  return (
    <StyledResizeHandle onClick={props.onFoldToggle}>
      <div>
        {props.folded ? (
          <i
            className="fa fa-angle-double-right"
            aria-hidden="true"
          />
        ) : (
          <i
            className="fa fa-angle-double-left"
            aria-hidden="true"
          />
        )}
      </div>
    </StyledResizeHandle>
  );
} 

export default ResizeHandle;
