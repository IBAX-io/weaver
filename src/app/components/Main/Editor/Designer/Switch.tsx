/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import imgSwitchOn from 'images/constructor/group-18.svg';
import imgSwitchOff from 'images/constructor/group-29.svg';

interface ISwitchProps {
  onChange?: any;
  initialValue?: any;
  onValue: any;
  offValue: any;
}

interface ISwitchState {
  on: boolean;
}

const ImgSwitch = styled.img`
  width: 30px;
`;

export default class Switch extends React.Component<
  ISwitchProps,
  ISwitchState
> {
  constructor(props: ISwitchProps) {
    super(props);
    this.state = {
      on: this.getBoolean(props.initialValue)
    };
  }

  getBoolean(value: string): boolean {
    return value === this.props.onValue ? true : false;
  }

  componentWillReceiveProps(props: ISwitchProps) {
    if (this.state.on !== this.getBoolean(props.initialValue)) {
      this.setState({
        on: this.getBoolean(props.initialValue)
      });
    }
  }

  render() {
    return (
      <div className="b-switch" onClick={this.change.bind(this)}>
        <ImgSwitch src={this.state.on ? imgSwitchOn : imgSwitchOff} />
      </div>
    );
  }
  change() {
    let on: boolean = !this.state.on;
    this.setState({
      on
    });
    if (this.props.onChange) {
      this.props.onChange(on ? this.props.onValue : this.props.offValue);
    }
  }
}
