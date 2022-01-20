/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { TEditorTab } from 'ibax/editor';

import Toolbar, { Filler } from '../Toolbar';
import ToolButton from 'components/Main/Toolbar/ToolButton';
import SegmentButton from 'components/Button/SegmentButton';
import DropdownToolButton from '../Toolbar/DropdownToolButton';
import Heading from 'components/Dropdown/Heading';
import Item from 'components/Dropdown/Item';

interface Props {
  currentTab: TEditorTab;
  canSave: boolean;
  canRevert: boolean;
  onRevert: () => void;
  onToolChange: (tool: string) => void;
  onExec: () => void;
  onSave: () => void;
  onCreateTab: (type: string) => void;
}

const editorTools = [
  {
    type: 'constructor',
    content: (
      <FormattedMessage id="editor.tool.designer" defaultMessage="Designer" />
    )
  },
  {
    type: 'editor',
    content: (
      <FormattedMessage id="editor.tool.developer" defaultMessage="Developer" />
    )
  },
  {
    type: 'preview',
    content: (
      <FormattedMessage id="editor.tool.preview" defaultMessage="Preview" />
    )
  }
];

const resolveToolIndex = (tool: string) => {
  return editorTools.findIndex((l) => l.type === tool);
};

const EditorToolbar: React.SFC<Props> = (props) => {
  const onToolChange = (toolIndex: number) => {
    const toolDef = editorTools[toolIndex];
    if (toolDef) {
      props.onToolChange(toolDef.type);
    }
  };

  return (
    <Toolbar>
      <DropdownToolButton
        icon="fa fa-plus-circle"
        content={
          <div>
            <Item
              icon="icon-vector text-danger"
              onClick={() => props.onCreateTab('contract')}
            >
              <FormattedMessage id="contract" defaultMessage="Smart contract" />
            </Item>
            <Heading>
              <FormattedMessage id="interface" defaultMessage="Interface" />
            </Heading>
            <Item
              icon="icon-note text-primary"
              onClick={() => props.onCreateTab('page')}
            >
              <FormattedMessage id="interface.page" defaultMessage="Page" />
            </Item>
            <Item
              icon="icon-list text-primary"
              onClick={() => props.onCreateTab('menu')}
            >
              <FormattedMessage id="interface.menu" defaultMessage="Menu" />
            </Item>
            <Item
              icon="icon-layers text-primary"
              onClick={() => props.onCreateTab('block')}
            >
              <FormattedMessage id="interface.block" defaultMessage="Block" />
            </Item>
          </div>
        }
      >
        <FormattedMessage id="editor.create" defaultMessage="Create" />
      </DropdownToolButton>
      <ToolButton
        icon="icon-note"
        disabled={!props.canSave}
        onClick={props.onSave}
      >
        <FormattedMessage id="editor.save" defaultMessage="Save" />
      </ToolButton>
      <ToolButton
        icon="icon-action-undo"
        disabled={!props.canRevert}
        onClick={props.onRevert}
      >
        <FormattedMessage id="editor.revert" defaultMessage="Revert" />
      </ToolButton>
      {props.currentTab && 'contract' === props.currentTab.type && (
        <ToolButton
          icon="icon-paper-plane"
          disabled={props.currentTab.new || props.canSave}
          onClick={props.onExec}
        >
          <FormattedMessage id="editor.execute" defaultMessage="Execute" />
        </ToolButton>
      )}
      <Filler />
      {props.currentTab && 'contract' !== props.currentTab.type && (
        <div style={{ alignSelf: 'center' }}>
          <SegmentButton
            activeIndex={resolveToolIndex(props.currentTab.tool)}
            onChange={onToolChange}
            items={editorTools.map((l) => l.content)}
          />
        </div>
      )}
    </Toolbar>
  );
};

export default EditorToolbar;
