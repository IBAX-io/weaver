/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TEditorTab } from 'ibax/editor';
import imgSim from 'components/Editor/simvolio/icon.svg';
import imgTpl from 'components/Editor/protypo/icon.svg';

import themed from 'components/Theme/themed';
import EditorTab from './EditorTab';
import HeaderButton from '../Header/HeaderButton';
import ScrollView from 'components/ScrollView';
import Item from 'components/Dropdown/Item';

export const TYPE_ICONS: { [type: string]: string } = {
  contract: imgSim,
  page: imgTpl,
  menu: imgTpl,
  block: imgTpl,
  default: null
};

interface Props {
  className?: string;
  tabIndex: number;
  tabs: TEditorTab[];
  onChange: (uuid: string) => void;
  onClose: (uuid: string) => void;
  onCloseAll: () => void;
  onCloseSaved: () => void;
}

const EditorTabs: React.SFC<Props> = (props) => (
  <div className={props.className}>
    <div className="editortabs__selector">
      <ScrollView
        className="editortabs__scrollarea"
        disableVertical
        hideHorizontal
        horizontalWheel
      >
        <ul>
          {props.tabs.map((tab, index) => (
            <EditorTab
              {...tab}
              key={index}
              active={props.tabIndex === index}
              icon={TYPE_ICONS[tab.type] || TYPE_ICONS.default}
              onClick={props.onChange.bind(null, tab.uuid)}
              onClose={props.onClose.bind(null, tab.uuid)}
            />
          ))}
        </ul>
      </ScrollView>
    </div>
    <div className="editortabs__menu">
      <HeaderButton
        className="editortabs__menubutton"
        menuWidth={225}
        align="right"
        content={
          <div>
            <Item
              onClick={props.onCloseSaved}
              icon="icon-docs"
              disabled={!props.tabs.length}
            >
              <FormattedMessage
                id="editor.close.saved"
                defaultMessage="Close saved tabs"
              />
            </Item>
            <Item
              onClick={props.onCloseAll}
              icon="icon-docs text-danger"
              disabled={!props.tabs.length}
            >
              <FormattedMessage
                id="editor.close.all"
                defaultMessage="Close all tabs"
              />
            </Item>
          </div>
        }
      >
        <em className="icon-options" />
      </HeaderButton>
    </div>
  </div>
);

const StyledEditorTabs = themed(EditorTabs)`
    background: ${(props) => props.theme.editorBackground};
    height: 36px;
    position: relative;

    .editortabs__scrollarea {
        ul {
            height: 36px;
            list-style-type: none;
            padding: 1px 0 0;
            margin: 0;
            white-space: nowrap;
        }
    }
    
    .editortabs__selector {
        height: 100%;
        margin-right: 40px;
    }

    .editortabs__menu {
        background: ${(props) => props.theme.editorBackground};
        position: absolute;
        top: 0;
        right: 0;

    }

    .editortabs__menubutton {
        width: 36px;
        height: 36px;
        line-height: 36px;
    }
`;

export default StyledEditorTabs;
