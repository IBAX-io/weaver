/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import styled from 'styled-components';
import MonacoEditor, { loader } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor';
import { editor } from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import registerProtypo from './protypo';
import registerSimvolio from './simvolio';

// Use the bundled monaco-editor instead of loading it from a CDN. Only the custom languages
// are used, so every worker request is served by the base editor worker
self.MonacoEnvironment = {
  getWorker: () => new EditorWorker()
};
loader.config({ monaco: monacoEditor });

registerProtypo(monacoEditor);
registerSimvolio(monacoEditor);

const StyledCodeEditor = styled.div`
  &.editor-flex {
    display: flex;
    flex-direction: column;
    flex: 1;

    > .code-editor-container {
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

const CodeEditor: React.FC<Props> = (props) => {
  const onChange = props.onChange;
  const handleChange = React.useCallback(
    (code: string | undefined) => {
      if (onChange) {
        onChange(code || '');
      }
    },
    [onChange]
  );

  return (
    <StyledCodeEditor className={props.height ? null : 'editor-flex'}>
      <MonacoEditor
        language={props.language}
        value={props.value}
        onChange={handleChange}
        options={{
          automaticLayout: true,
          contextmenu: false,
          scrollBeyondLastLine: false,
          ...props.options
        }}
        height={props.height || '100%'}
        wrapperProps={{ className: 'code-editor-container' }}
      />
    </StyledCodeEditor>
  );
};

export default CodeEditor;
