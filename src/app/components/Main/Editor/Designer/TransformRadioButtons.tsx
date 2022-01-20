/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import RadioButton from './RadioButton';

import imgLowercase from 'images/constructor/tt-lower.svg';
import imgUppercase from 'images/constructor/tt-upper.svg';

interface IRadioButtonsProps {
  onSelect?: any;
  initialValue?: string;
}

interface IRadioButtonsState {
  value: string;
  initialValue?: string;
}

export default class RadioButtons extends React.Component<
  IRadioButtonsProps,
  IRadioButtonsState
> {
  constructor(props: IRadioButtonsProps) {
    super(props);
    this.state = {
      value: props.initialValue || ''
    };
  }

  componentWillReceiveProps(props: IRadioButtonsProps) {
    if (this.state.value !== props.initialValue) {
      this.setState({
        value: props.initialValue
      });
    }
  }

  render() {
    return (
      <div>
        <RadioButton
          value="uppercase"
          onClick={this.selectRadio.bind(this, 'uppercase')}
          selectedValue={this.state.value}
        >
          <img src={imgUppercase} title="UPPERCASE" />
        </RadioButton>
        <RadioButton
          value="lowercase"
          onClick={this.selectRadio.bind(this, 'lowercase')}
          selectedValue={this.state.value}
        >
          <img src={imgLowercase} title="lowercase" />
        </RadioButton>
      </div>
    );
  }
  selectRadio(value: string) {
    let newValue: string = value === this.state.value ? '' : value;
    this.setState({
      value: newValue
    });
    if (this.props.onSelect) {
      this.props.onSelect(newValue);
    }
  }
}
