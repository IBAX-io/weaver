/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import RadioButton from './RadioButton';

import imgAlignLeft from 'images/constructor/group-28.svg';
import imgAlignCenter from 'images/constructor/group-27.svg';
import imgAlignRight from 'images/constructor/group-26.svg';

interface IRadioButtonsProps {
  onSelect?: any;
  initialValue?: string;
}

interface IRadioButtonsState {
  value: string;
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
          value="left"
          onClick={this.selectRadio.bind(this, 'left')}
          selectedValue={this.state.value}
        >
          <img src={imgAlignLeft} title="align left" />
        </RadioButton>
        <RadioButton
          value="center"
          onClick={this.selectRadio.bind(this, 'center')}
          selectedValue={this.state.value}
        >
          <img src={imgAlignCenter} title="align center" />
        </RadioButton>
        <RadioButton
          value="right"
          onClick={this.selectRadio.bind(this, 'right')}
          selectedValue={this.state.value}
        >
          <img src={imgAlignRight} title="align right" />
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
