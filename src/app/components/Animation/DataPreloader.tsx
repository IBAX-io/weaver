/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

export interface IDataPreloaderProps {
  data: any[];
  children: JSX.Element;
}

interface IDataPreloaderState {
  pending: boolean;
}

class DataPreloader extends React.Component<
  IDataPreloaderProps,
  IDataPreloaderState
> {
  constructor(props: IDataPreloaderProps) {
    super(props);
    this.state = {
      pending: true
    };
  }

  componentDidMount() {
    this.onCheck();
  }

  componentWillReceiveProps(props: IDataPreloaderProps) {
    this.onCheck(props);
  }

  onCheck(props: IDataPreloaderProps = this.props) {
    if (0 === props.data.filter((l) => !l).length) {
      this.setState({
        pending: false
      });
    } else {
      this.setState({
        pending: true
      });
    }
  }

  render() {
    return this.state.pending ? null : this.props.children;
  }
}

export default DataPreloader;
