/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import RadioButton from './RadioButton';

import imgItalic from 'images/constructor/group-15.svg';
import imgBold from 'images/constructor/group-16.svg';

interface IFormatButtonsProps {
  tag: string;
  onClick: (format: string) => void;
}

export default class FormatButtons extends React.Component<
  IFormatButtonsProps
> {
  render() {
    return (
      <div>
        {this.props.tag !== 'strong' && (
          <RadioButton
            onClick={() => this.props.onClick('bold')}
            value="bold"
            title="make selected text bold"
          >
            <img src={imgBold} />
          </RadioButton>
        )}

        {this.props.tag !== 'em' && (
          <RadioButton
            onClick={() => this.props.onClick('italic')}
            value="italic"
            title="make selected text italic"
          >
            <img src={imgItalic} />
          </RadioButton>
        )}

        <RadioButton
          onClick={() => this.props.onClick('removeFormat')}
          value="removeFormat"
          title="remove formatting on selected text"
        >
          <span>&times;</span>
        </RadioButton>
      </div>
    );
  }
}
