/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import RadioButtonColor from './RadioButtonColor';

interface IRadioButtonsProps {
  onSelect?: (value: string) => void;
  initialValue?: string;
}

interface IRadioButtonsState {
  value: string;
  initialValue: string;
}

export default class RadioButtons extends React.Component<
  IRadioButtonsProps,
  IRadioButtonsState
> {
  constructor(props: IRadioButtonsProps) {
    super(props);
    this.state = {
      value: props.initialValue || '',
      initialValue: props.initialValue
    };
  }

  // Follow the selected tag: reset the local selection whenever the tag value changes
  static getDerivedStateFromProps(
    props: IRadioButtonsProps,
    state: IRadioButtonsState
  ): Partial<IRadioButtonsState> | null {
    if (props.initialValue !== state.initialValue) {
      return {
        value: props.initialValue,
        initialValue: props.initialValue
      };
    }
    return null;
  }

  render() {
    return (
      <div>
        <RadioButtonColor
          value="muted"
          onClick={this.selectRadio.bind(this, 'muted')}
          selectedValue={this.state.value}
        />
        <RadioButtonColor
          value="primary"
          onClick={this.selectRadio.bind(this, 'primary')}
          selectedValue={this.state.value}
        />
        <RadioButtonColor
          value="success"
          onClick={this.selectRadio.bind(this, 'success')}
          selectedValue={this.state.value}
        />
        <RadioButtonColor
          value="info"
          onClick={this.selectRadio.bind(this, 'info')}
          selectedValue={this.state.value}
        />
        <RadioButtonColor
          value="warning"
          onClick={this.selectRadio.bind(this, 'warning')}
          selectedValue={this.state.value}
        />
        <RadioButtonColor
          value="danger"
          onClick={this.selectRadio.bind(this, 'danger')}
          selectedValue={this.state.value}
        />
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
