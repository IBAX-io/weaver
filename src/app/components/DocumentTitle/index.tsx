/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { useIntl } from 'react-intl';

export interface IDocumentTitleProps {
  title: string;
}

// Nested titles: the deepest mounted DocumentTitle wins, and the outer one is restored
// when it unmounts. Effects run child-first, so nesting depth (not mount order) decides.
const DepthContext = React.createContext(0);

interface ITitleEntry {
  depth: number;
  title: string;
}

const entries = new Map<symbol, ITitleEntry>();

const applyTitle = () => {
  let active: ITitleEntry = null;
  entries.forEach((entry) => {
    if (!active || entry.depth >= active.depth) {
      active = entry;
    }
  });
  if (active) {
    document.title = active.title;
  }
};

const DocumentTitle: React.FC<React.PropsWithChildren<IDocumentTitleProps>> = (props) => {
  const intl = useIntl();
  const depth = React.useContext(DepthContext) + 1;
  const [id] = React.useState(() => Symbol('DocumentTitle'));

  const title = props.title
    ? intl.formatMessage(
        {
          id: 'general.title.format',
          defaultMessage: '{title} | Ibax'
        },
        { title: props.title }
      )
    : intl.formatMessage({
        id: 'general.title',
        defaultMessage: 'Ibax'
      });

  React.useEffect(() => {
    entries.set(id, { depth, title });
    applyTitle();
  }, [id, depth, title]);

  React.useEffect(
    () => () => {
      entries.delete(id);
      applyTitle();
    },
    [id]
  );

  return <DepthContext.Provider value={depth}>{props.children}</DepthContext.Provider>;
};

export default DocumentTitle;
