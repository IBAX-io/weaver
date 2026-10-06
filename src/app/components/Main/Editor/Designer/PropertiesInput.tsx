/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Col, Form, Row } from 'react-bootstrap';

export interface IPropertiesInputProps {
  name: string;
  title: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

const PropertiesInput: React.FC<IPropertiesInputProps> = (props) => {
  return (
    <Form.Group as={Row} className="mb-3">
      <Form.Label column xs={3} className="g-no-padding">
        <small>{props.title}</small>
      </Form.Label>
      <Col xs={9}>
        <Form.Control
          type="text"
          size="sm"
          placeholder={props.placeholder || props.title}
          value={props.value}
          onChange={props.onChange}
          readOnly={!!props.readOnly}
        />
      </Col>
    </Form.Group>
  );
};

export default PropertiesInput;
