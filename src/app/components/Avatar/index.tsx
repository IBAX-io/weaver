/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';
import imgAvatar from './avatar.svg';

export interface IAvatarProps {
  className?: string;
  url: string;
  size?: number;
}

interface IAvatarState {
  error: boolean;
}

class Avatar extends React.Component<IAvatarProps, IAvatarState> {
  constructor(props: IAvatarProps) {
    super(props);
    this.state = {
      error: false
    };
  }

  onError = () => {
    this.setState({
      error: true
    });
  };

  render() {
    return (
      <div className={this.props.className}>
        <img
          className="avatar__image"
          src={this.state.error ? imgAvatar : this.props.url}
          onError={this.onError}
        />
      </div>
    );
  }
}

export default styled(Avatar)`
  display: inline-block;
  vertical-align: top;
  width: ${(props) => (props.size ? props.size + 'px' : 'auto')};
  height: ${(props) => (props.size ? props.size + 'px' : 'auto')};

  .avatar__image {
    max-width: ${(props) => (props.size ? props.size + 'px' : '100%')};
    max-height: ${(props) => (props.size ? props.size + 'px' : '100%')};
  }
`;
