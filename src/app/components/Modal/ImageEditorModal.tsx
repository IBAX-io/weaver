/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Well } from 'react-bootstrap';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

import Modal from './';

export interface IImageEditorModalProps {
    mime: string;
    data: string;
    aspectRatio: number;
    width: number;
}

class ImageEditorModal extends Modal<IImageEditorModalProps, string> {
    private _cropper: Cropper = null;

    onSuccess() {
        const input = this._cropper.getCroppedCanvas();

        if (this.props.params.width) {
            const output = document.createElement('canvas'),
                ctx = output.getContext('2d'),
                oc = document.createElement('canvas'),
                octx = oc.getContext('2d');

            output.width = this.props.params.width;
            output.height = this.props.params.width * input.height / input.width;

            let current = {
                width: Math.floor(input.width * 0.5),
                height: Math.floor(input.height * 0.5)
            };

            oc.width = current.width;
            oc.height = current.height;

            octx.drawImage(input, 0, 0, current.width, current.height);

            while (current.width * 0.5 > this.props.params.width) {
                current = {
                    width: Math.floor(current.width * 0.5),
                    height: Math.floor(current.height * 0.5)
                };
                octx.drawImage(oc, 0, 0, current.width * 2, current.height * 2, 0, 0, current.width, current.height);
            }

            ctx.drawImage(oc, 0, 0, current.width, current.height, 0, 0, output.width, output.height);
            this.props.onResult(output.toDataURL(this.props.params.mime));
        }
        else {
            this.props.onResult(input.toDataURL(this.props.params.mime));
        }
    }

    render() {
        return (
            <div>
                <Modal.Header>
                    <FormattedMessage id="modal.imageeditor.title" defaultMessage="Image editor" />
                </Modal.Header>
                <Modal.Body>
                    <Well>
                        <FormattedMessage id="modal.imageeditor.desc" defaultMessage="Prepare your image for uploading by selecting which part of the image you want to use" />
                    </Well>
                    <Cropper
                        ref={(ref: any) => this._cropper = ref}
                        src={this.props.params.data}
                        style={{ maxHeight: 400, width: '100%' }}
                        aspectRatio={this.props.params.aspectRatio}
                        viewMode={1}
                    />
                </Modal.Body>
                <Modal.Footer className="text-right">
                    <Button type="button" bsStyle="link" onClick={this.props.onCancel.bind(this)}>
                        <FormattedMessage id="modal.imageeditor.cancel" defaultMessage="Cancel" />
                    </Button>
                    <Button type="button" bsStyle="primary" onClick={this.onSuccess.bind(this)}>
                        <FormattedMessage id="modal.imageeditor.confirm" defaultMessage="Confirm" />
                    </Button>
                </Modal.Footer>
            </div>
        );
    }
}

export default ImageEditorModal;