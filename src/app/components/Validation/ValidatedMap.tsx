/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Validator } from './Validators';
import { IMapEditorEvent, TMapType } from 'ibax/geo';
import { IMapEditorModalProps } from 'components/Modal/MapEditorModal';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';

export interface IValidatedMapProps {
    name: string;
    mapType?: TMapType;
    value?: IMapEditorEvent;
    center?: [number, number];
    zoom?: number;
    validators?: Validator[];
    openEditor: (params: IMapEditorModalProps) => void;
}

interface IValidatedMapState {
    address: string;
}

export default class ValidatedMap extends React.Component<IValidatedMapProps, IValidatedMapState> implements IValidatedControl {
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    private _value: IMapEditorEvent = {
        type: 'point',
        coords: [],
        address: '',
        area: 0
    };

    constructor(props: IValidatedMapProps) {
        super(props);
        this.state = {
            address: ''
        };
    }

    componentDidMount() {
        if (this.context.form) {
            this.context.form._registerElement(this);
        }
    }

    componentWillUnmount() {
        if (this.context.form) {
            this.context.form._unregisterElement(this);
        }
    }

    componentDidUpdate(prevProps: IValidatedMapProps) {
        if (this.props.value && prevProps.value !== this.props.value) {
            const address = this.state.address !== this.props.value.address ? this.props.value.address : this.state.address;
            this._value = {
                ...this.props.value,
                address
            };

            this.setState({
                address
            });
        }
    }

    getValue() {
        return JSON.stringify(this._value);
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this._value.address = e.target.value;
        this.setState({
            address: e.target.value
        });
    }

    openEditor = () => {
        this.props.openEditor({
            tool: this.props.value ? this.props.value.type : null,
            mapType: this.props.mapType,
            coords: this.props.value && this.props.value.coords,
            center: this.props.center,
            zoom: this.props.zoom
        });
    }

    render() {
        return (
            <div className="input-group">
                <input type="text" className="form-control" value={this.state.address} onChange={this.onChange} disabled={!this.props.value} />

                <button className="btn btn-secondary" style={{ border: 'solid 1px #dde6e9' }} type="button" onClick={this.openEditor}>
                    <span className="text-muted fa fa-map-marker" />
                </button>
            </div>
        );
    }
}
