/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { TEditorTab } from 'ibax/editor';

import CodeEditor from 'components/Editor/CodeEditor';
import EditorTabs from './EditorTabs';
import EditorTool from './EditorTool';
import EditorToolbar from 'containers/Toolbar/EditorToolbar';
import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';

interface Props {
  mainSection: string;
  tabIndex: number;
  tabs: TEditorTab[];
  onTabChange?: (uuid: string) => void;
  onTabUpdate?: (value: string) => void;
  onTabClose?: (uuid: string) => void;
  onTabCloseAll?: () => void;
  onTabCloseSaved?: () => void;
}

const Editor: React.SFC<Props> = (props) => (
  <LocalizedDocumentTitle title="editor">
    <div className="fullscreen noscroll">
      <EditorToolbar />
      <EditorTabs
        tabIndex={props.tabIndex}
        tabs={props.tabs}
        onChange={props.onTabChange}
        onClose={props.onTabClose}
        onCloseAll={props.onTabCloseAll}
        onCloseSaved={props.onTabCloseSaved}
      />
      {props.tabs.map((tab, index) => (
        <div
          key={index}
          className="fullscreen"
          style={{ display: props.tabIndex === index ? null : 'none' }}
        >
          <div
            className="fullscreen"
            style={{ display: 'editor' === tab.tool ? null : 'none' }}
          >
            <CodeEditor
              language={'contract' === tab.type ? 'simvolio' : 'protypo'}
              value={tab.value}
              onChange={props.onTabUpdate}
            />
          </div>
          {index === props.tabIndex && 'editor' !== tab.tool ? (
            <EditorTool mainSection={props.mainSection} value={tab} />
          ) : null}
        </div>
      ))}
    </div>
  </LocalizedDocumentTitle>
);

export default Editor;
