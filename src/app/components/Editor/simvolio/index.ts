/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import syntax from './monarch';

const langName = 'simvolio';

const register = (editor: typeof monaco) => {
  if (monaco.languages.getLanguages().find(l => langName === l.id)) {
    return;
  }

  monaco.languages.register({
    id: langName
  });

  editor.languages.setMonarchTokensProvider(langName, syntax());
};

export default register;