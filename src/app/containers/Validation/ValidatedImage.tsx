/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as uuid from 'uuid';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { IModal } from 'ibax/modal';
import { modalShow } from 'modules/modal/actions';

import { Validator } from 'components/Validation/Validators';
import ValidatedImage from 'components/Validation/ValidatedImage';

export interface IValidatedImageContainerProps {
    format: 'png' | 'jpg' | 'jpeg';
    name: string;
    aspectRatio?: number;
    width?: number;
    validators?: Validator[];
}

interface IValidatedImageContainerState {
    modal: IModal;
}

interface IValidatedImageContainerDispatch {
    modalShow: typeof modalShow;
}

class ValidatedImageContainer extends React.Component<IValidatedImageContainerProps & IValidatedImageContainerState & IValidatedImageContainerDispatch, { result: string }> {
    private _id: string = uuid.v4();

    constructor(props: any) {
        super(props);
        this.state = {
            result: null
        };
    }

    openEditor(params: { mime: string, data: string, aspectRatio: number, width: number }) {
        this.props.modalShow({
            id: this._id,
            type: 'IMAGE_EDITOR',
            params
        });
    }

    componentWillReceiveProps(props: IValidatedImageContainerProps & IValidatedImageContainerState & IValidatedImageContainerDispatch) {
        const result = props.modal && this._id === props.modal.id && props.modal.result;
        if (result && 'RESULT' === result.reason) {
            this.setState({
                result: result.data
            });
        }
    }

    render() {
        return (
            <ValidatedImage
                format={this.props.format}
                name={this.props.name}
                aspectRatio={this.props.aspectRatio}
                width={this.props.width}
                validators={this.props.validators}
                value={this.state.result}
                openEditor={this.openEditor.bind(this)}
            />
        );
    }
}

const mapStateToProps = (state: IRootState) => ({
    modal: state.modal
});

const mapDispatchToProps = {
    modalShow: modalShow
};

export default connect<IValidatedImageContainerState, IValidatedImageContainerDispatch, IValidatedImageContainerProps>(mapStateToProps, mapDispatchToProps)(ValidatedImageContainer);