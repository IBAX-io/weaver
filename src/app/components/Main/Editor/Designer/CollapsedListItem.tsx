/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as classnames from 'classnames';

interface ICollapsedListItemProps {
  text: string;
  icon?: string;
}

interface ICollapsedListItemState {
  collapsed: boolean;
}

export default class CollapsedListItem extends React.Component<
  ICollapsedListItemProps,
  ICollapsedListItemState
> {
  constructor(props: ICollapsedListItemProps) {
    super(props);
    this.state = {
      collapsed: true
    };
  }
  render() {
    const classes = classnames({
      collapsed: this.state.collapsed
    });

    return (
      <li className={classes}>
        <div onClick={this.toggleCollapsed.bind(this)}>
          <img src={this.props.icon} />
          {this.props.text}
        </div>
        {this.props.children}
      </li>
    );
  }
  toggleCollapsed() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  }
}
