/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import imgClose from 'images/close.svg';
import { FormattedMessage } from 'react-intl';
import { TEditorTab } from 'ibax/editor';

import themed from 'components/Theme/themed';

interface Props extends TEditorTab {
  icon: string;
  active?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onClose?: (e: React.MouseEvent<HTMLElement>) => void;
}

const EditorTab: React.SFC<Props> = (props) => {
  const onClose = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (props.onClose) {
      props.onClose(e);
    }
  };

  const onMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Catch middle mouse button to close the tab
    if (1 === e.button) {
      props.onClose(e);
    }
  };

  return (
    <li
      className={classNames(props.className, {
        active: props.active,
        emphasis: props.dirty
      })}
    >
      <button onClick={props.onClick} onMouseUp={onMouseUp}>
        <div className="icon">
          <img className="icon" src={props.icon} />
        </div>
        <div className="tab-label">
          {props.name ? (
            <span>{props.name}</span>
          ) : (
            <FormattedMessage
              id="editor.untitled"
              defaultMessage="Untitled-{id}"
              values={{ id: props.id }}
            />
          )}
        </div>
        <div className="tab-badge" />
        <div className="tab-close" onClick={onClose}>
          <img src={imgClose} />
        </div>
      </button>
    </li>
  );
};

const StyledEditorTab = themed(EditorTab)`
    position: relative;
    background: #ddd;
    color: #7a899c;
    display: inline-block;
    margin-right: 1px;
    text-align: left;
    min-width: 80px;
    font-size: 0;

    &.active, &.active:hover {
        background: #fff;
        color: #4970a2;

        .tab-label {
            color: #4970a2;
        }

        .tab-close {
            display: block;
        }

        .tab-badge {
            display: none;
        }
    }

    &.emphasis {
        .tab-label {
            font-style: italic;
        }

        .tab-badge {
            background: #ff8700;
        }
    }

    &:hover {
        background: #eee;

        .tab-close {
            display: block;
        }

        .tab-badge {
            display: none;
        }
    }

    button {
        padding: 0 26px 0 40px;
        border: none;
        background: 0;
        outline: 0;
        cursor: pointer;
        height: 35px;
        line-height: 25px;
        overflow: hidden;
        font-size: 13px;

        .icon {
            position: absolute;
            top: 3px;
            left: 5px;
            width: 24px;
            height: 24px;
            margin-right: 5px;
        }

        .tab-badge {
            position: absolute;
            top: 14px;
            right: 11px;
            width: 8px;
            height: 8px;
            border-radius: 4px;
            z-index: 5;
        }

        .tab-close {
            position: absolute;
            top: 10px;
            right: 7px;
            width: 16px;
            height: 16px;
            padding: 3px;
            text-align: center;
            line-height: 6px;
            font-weight: bold;
            font-size: 16px;
            color: #666;
            z-index: 10;
            display: none;
            opacity: 0.5;
            transition: opacity .17s ease-in-out;

            &:hover {
                opacity: 1;
            }

            > img {
                max-width: 100%;
                max-height: 100%;
            }
        }

        .tab-label {
            color: #a2aab3;
            max-width: 105px;
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
            white-space: nowrap;
        }
    }
`;

export default StyledEditorTab;
