/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button, Col } from 'react-bootstrap';

export interface IGeneratorToolProps {
  disabled?: boolean;
  onClick: () => void;
}

const GeneratorTool: React.FC<React.PropsWithChildren<IGeneratorToolProps>> = (props) => (
  <Col xs={4}>
    <Button
      variant="secondary"
      disabled={props.disabled}
      className="w-100"
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  </Col>
);

export default GeneratorTool;
