/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import propTypes from 'prop-types';
import onClickOutside, { InjectedOnClickOutProps } from 'react-onclickoutside';

import Dropdown from 'components/Dropdown';
import Button from './';

type ButtonComponent = React.ComponentType<{
  onClick: (e: React.MouseEvent<any>) => void;
  disabled?: boolean;
  className?: string;
}>;

interface Props {
  buttonComponent?: ButtonComponent;
  disabled?: boolean;
  className?: string;
  active?: boolean;
  content: React.ReactNode;
  align?: 'left' | 'right';
  menuWidth?: number;
}

interface State {
  active: boolean;
}

class DropdownButton extends React.Component<
  Props & InjectedOnClickOutProps,
  State
> {
  state: State = {
    active: false
  };

  static childContextTypes = {
    closeDropdown: propTypes.func.isRequired
  };

  getChildContext = () => ({
    closeDropdown: () => {
      this.setState({
        active: false
      });
    }
  });

  handleClick = () => {
    this.setState({
      active: !this.state.active
    });
  };

  handleClickOutside = (_event: React.MouseEvent<HTMLElement>) => {
    this.setState({
      active: false
    });
  };

  render() {
    const Component = this.props.buttonComponent || Button;
    return (
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <Component
          disabled={this.props.disabled}
          className={this.props.className}
          onClick={this.handleClick}
        >
          {this.props.children}
        </Component>
        <Dropdown
          active={this.state.active}
          align={this.props.align}
          width={this.props.menuWidth}
        >
          {this.props.content}
        </Dropdown>
      </div>
    );
  }
}

export default onClickOutside(DropdownButton);
