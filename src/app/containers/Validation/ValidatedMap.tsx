/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as uuid from 'uuid';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { modalShow } from 'modules/modal/actions';
import { IMapEditorEvent, TMapEditorType, TMapType } from 'ibax/geo';
import { IModal } from 'ibax/modal';

import { Validator } from 'components/Validation/Validators';
import ValidatedMap from 'components/Validation/ValidatedMap';

export interface IValidatedMapContainerProps {
    name: string;
    type: TMapEditorType;
    mapType?: TMapType;
    value?: IMapEditorEvent;
    center?: [number, number];
    zoom?: number;
    validators?: Validator[];
}

interface IValidatedMapContainerState {
    modal: IModal;
}

interface IValidatedMapContainerDispatch {
    modalShow: typeof modalShow;
}

class ValidatedMapContainer extends React.Component<IValidatedMapContainerProps & IValidatedMapContainerState & IValidatedMapContainerDispatch, { result: IMapEditorEvent }> {
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
            type: 'MAP_EDITOR',
            params
        });
    }

    componentWillReceiveProps(props: IValidatedMapContainerProps & IValidatedMapContainerState & IValidatedMapContainerDispatch) {
        const result = props.modal && this._id === props.modal.id && props.modal.result;
        if (result && 'RESULT' === result.reason) {
            this.setState({
                result: result.data
            });
        }
    }

    render() {
        return (
            <ValidatedMap
                name={this.props.name}
                mapType={this.props.mapType}
                validators={this.props.validators}
                value={this.state.result || this.props.value}
                center={this.props.center}
                zoom={this.props.zoom}
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

export default connect<IValidatedMapContainerState, IValidatedMapContainerDispatch, IValidatedMapContainerProps>(mapStateToProps, mapDispatchToProps)(ValidatedMapContainer);