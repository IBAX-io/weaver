/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import imgSwitchOn from 'images/constructor/group-18.svg';
import imgSwitchOff from 'images/constructor/group-29.svg';

type TSwitchValue = string | boolean;

interface ISwitchProps {
  onChange?: (value: TSwitchValue) => void;
  initialValue?: TSwitchValue;
  onValue: TSwitchValue;
  offValue: TSwitchValue;
}

interface ISwitchState {
  on: boolean;
  initialValue: TSwitchValue;
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
      on: Switch.isOn(props),
      initialValue: props.initialValue
    };
  }

  static isOn(props: ISwitchProps): boolean {
    return props.initialValue === props.onValue;
  }

  // Follow the owner: reset the switch whenever the initial value changes
  static getDerivedStateFromProps(
    props: ISwitchProps,
    state: ISwitchState
  ): Partial<ISwitchState> | null {
    if (props.initialValue !== state.initialValue) {
      return {
        on: Switch.isOn(props),
        initialValue: props.initialValue
      };
    }
    return null;
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
