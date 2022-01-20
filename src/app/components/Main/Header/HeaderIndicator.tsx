/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';

import Tooltip from 'components/Tooltip';

interface Props {
  icon: string;
  className?: string;
  right?: boolean;
  title: JSX.Element | string;
  titleDesc: JSX.Element | string;
}

const HeaderIndicator: React.SFC<Props> = (props) => (
  <li
    className={props.className}
    style={{ float: props.right ? 'right' : null }}
  >
    <Tooltip title={props.title} body={props.titleDesc}>
      <div className="tool-body">
        <em className={`tool-icon ${props.icon}`} />
        {props.children && (
          <span className="button-label">{props.children}</span>
        )}
      </div>
    </Tooltip>
  </li>
);

const StyledHeaderIndicator = themed(HeaderIndicator)`
    display: inline-block;
    vertical-align: top;
    text-align: center;
    font-size: 14px;
    font-weight: 300;
    line-height: 40px;

    .tool-body {
        min-width: 40px;
        height: 40px;
        padding: 0 12px;
        font-weight: 300;

        em.tool-icon {
            color: ${(props) => props.theme.menubarForeground};
            transition: color .15s;
            vertical-align: middle;
            height: 18px;
            display: inline-block;
        }

        > span.button-label {
            margin-left: 8px;
            color: ${(props) => props.theme.menubarForeground};
        }

        &:hover {
            em.tool-icon {
                color: ${(props) => props.theme.menubarForegroundActive};
            }
        }
    }
`;

export default StyledHeaderIndicator;
