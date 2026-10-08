/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

export interface IImageEditorProps {
  active: boolean;
  mime: string;
  data: string;
  result: string;
  aspectRatio?: number;
  width?: number;
  onResult: (data: string) => void;
  openEditor: (params: {
    mime: string;
    data: string;
    width?: number;
    aspectRatio?: number;
  }) => void;
}

interface IImateEditorState {
  active: boolean;
}

class ImageEditor extends React.Component<
  IImageEditorProps,
  IImateEditorState
> {
  constructor(props: IImageEditorProps) {
    super(props);
    this.state = {
      active: false
    };
  }

  componentDidUpdate(prevProps: IImageEditorProps) {
    // Only react to prop updates; our own state updates must not re-trigger the checks
    if (prevProps === this.props) {
      return;
    }

    if (!this.state.active && prevProps.data !== this.props.data) {
      this.props.openEditor({
        mime: this.props.mime,
        data: this.props.data,
        width: this.props.width,
        aspectRatio: this.props.aspectRatio
      });

      this.setState({
        active: true
      });
    }

    if (this.state.active && !this.props.active) {
      this.props.onResult(this.props.result);
      this.setState({
        active: false
      });
    }
  }

  render() {
    return null as React.JSX.Element;
  }
}

export default ImageEditor;
