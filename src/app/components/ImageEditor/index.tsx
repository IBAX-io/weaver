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

  componentDidMount() {
    this.onPropsUpdate(this.props);
  }

  componentWillReceiveProps(props: IImageEditorProps) {
    this.onPropsUpdate(props);
  }

  onPropsUpdate(props: IImageEditorProps) {
    if (!this.state.active && this.props.data !== props.data) {
      props.openEditor({
        mime: props.mime,
        data: props.data,
        width: props.width,
        aspectRatio: props.aspectRatio
      });

      this.setState({
        active: true
      });
    }

    if (this.state.active && !props.active) {
      props.onResult(props.result);
      this.setState({
        active: false
      });
    }
  }

  render() {
    return null as JSX.Element;
  }
}

export default ImageEditor;
