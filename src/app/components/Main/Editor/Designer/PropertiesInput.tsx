/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Col } from 'react-bootstrap';

export interface IPropertiesInputProps {
  name: string;
  title: string;
  placeholder?: string;
  value: string;
  onChange?: any;
  readOnly?: boolean;
}

const PropertiesInput: React.SFC<IPropertiesInputProps> = (props) => {
  return (
    <div className="form-group">
      <label className="col-xs-3 control-label g-no-padding">
        <small>{props.title}</small>
      </label>
      <Col xs={9}>
        <input
          type="text"
          className="form-control input-sm"
          placeholder={props.placeholder || props.title}
          value={props.value}
          onChange={props.onChange}
          readOnly={!!props.readOnly}
        />
      </Col>
    </div>
  );
};

export default PropertiesInput;
