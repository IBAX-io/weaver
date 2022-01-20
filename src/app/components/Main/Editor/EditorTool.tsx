/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { TEditorTab } from 'ibax/editor';

import ConstructorTabbed from 'containers/Main/Editor/ConstructorTabbed';
import Page from 'components/Main/Navigator/Page';

interface Props {
  mainSection: string;
  value: TEditorTab;
}

const EditorTool: React.SFC<Props> = (props) => {
  switch (props.value.tool) {
    case 'constructor':
      return (
        <ConstructorTabbed
          section={props.mainSection}
          pageID={props.value.id}
          pageName={props.value.name}
        />
      );

    case 'preview':
      return (
        <div className="flex-col flex-stretch scroll">
          <Page
            section={props.mainSection}
            value={{
              name: 'preview',
              status: 'LOADED',
              content: props.value.preview,
              static: false,
              params: {},
              location: {
                key: 'preview',
                pathname: 'preview',
                search: '',
                state: '',
                hash: ''
              }
            }}
          />
        </div>
      );

    default:
      return null;
  }
};

export default EditorTool;
