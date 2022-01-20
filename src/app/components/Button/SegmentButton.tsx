/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';

import themed from 'components/Theme/themed';

interface Props {
  className?: string;
  disabled?: boolean;
  activeIndex: number;
  items: React.ReactNode[];
  onChange?: (index: number) => void;
}

const SegmentButton: React.SFC<Props> = (props) => (
  <ul className={classNames('button-sections', props.className)}>
    {props.items.map((l, i) => (
      <li key={i} className={props.activeIndex === i ? 'active' : null}>
        <button
          type="button"
          onClick={props.onChange && props.onChange.bind(null, i)}
        >
          {l}
        </button>
      </li>
    ))}
  </ul>
);

const StyledSegmentButton = themed(SegmentButton)`
    border: solid 1px ${(props) => props.theme.sectionButtonOutline};
    border-radius: 2px;
    list-style-type: none;
    padding: 0;
    margin: 0;
    font-size: 0;
    display: inline-block;
    line-height: 20px;
    height: 22px;

    li {
        display: inline-block;

        button {
            background: 0;
            outline: 0;
            border: 0;
            border-right: solid 1px ${(props) =>
              props.theme.sectionButtonOutline};
            height: 20px;
            font-size: 13px;
            padding: 0 10px;
            color: ${(props) => props.theme.sectionButtonForeground};
        }

        &:last-child button {
            border-right: 0;
        }

        &:hover button {
            background: ${(props) => props.theme.sectionButtonBackground};
        }
        
        &.active button {
            background: ${(props) => props.theme.sectionButtonActive};
            color: ${(props) => props.theme.sectionButtonPrimary};
        }
    }
`;

export default StyledSegmentButton;
