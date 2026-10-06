/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import MonacoEditor from 'react-monaco-editor';
import registerProtypo from './protypo';
import registerSimvolio from './simvolio';

import * as monacoEditor from 'monaco-editor';
import { editor } from 'monaco-editor';

registerProtypo(monacoEditor);
registerSimvolio(monacoEditor);

const StyledCodeEditor = styled.div`
  &.editor-flex {
    display: flex;
    flex-direction: column;
    flex: 1;

    > .react-monaco-editor-container {
      flex: 1;
    }
  }
`;

interface Props {
  language?: string;
  value?: string;
  width?: number;
  height?: number;
  options?: editor.IEditorOptions;
  onChange?: (code: string) => void;
}

const CodeEditor: React.SFC<Props> = (props) => (
  <StyledCodeEditor className={props.height ? null : 'editor-flex'}>
    <MonacoEditor
      language={props.language}
      value={props.value}
      onChange={props.onChange}
      options={{
        automaticLayout: true,
        contextmenu: false,
        scrollBeyondLastLine: false,
        ...props.options
      }}
      height={props.height}
    />
  </StyledCodeEditor>
);

export default CodeEditor;
