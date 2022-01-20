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

const GeneratorTool: React.SFC<IGeneratorToolProps> = (props) => (
  <Col xs={4} className="pl0 pr0">
    <Button
      disabled={props.disabled}
      className="btn-block"
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  </Col>
);

export default GeneratorTool;
