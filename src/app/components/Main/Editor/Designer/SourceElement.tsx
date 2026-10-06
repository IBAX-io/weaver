/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { useDrag } from '@nosferatu500/react-dnd';
import { ISourceElement } from 'ibax/editor';
import { CONSTRUCTOR_DND_TYPE } from 'components/ProtypoConstructor/handlers/DnDComponent';

interface ISourceElementProps {
  text: string;
  element?: string;
  template?: string;
}

const SourceElement: React.FC<ISourceElementProps> = (props) => {
  const [, drag, preview] = useDrag(
    () => ({
      type: CONSTRUCTOR_DND_TYPE,
      item: (): ISourceElement => ({
        new: true,
        element: props.element,
        template: props.template,
        text: props.text
      }),
      previewOptions: { offsetY: -10 }
    }),
    [props.element, props.template, props.text]
  );

  const ref = React.useCallback(
    (node: HTMLLIElement | null) => {
      drag(node);
      preview(node);
    },
    [drag, preview]
  );

  return <li ref={ref}>{props.text}</li>;
};

export default SourceElement;
