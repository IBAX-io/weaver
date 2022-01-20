/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormControl } from 'react-bootstrap';
import { Validator } from './Validators';
import * as propTypes from 'prop-types';
import { readBinaryFile } from 'lib/fs';

import ValidatedForm, { IValidatedControl } from './ValidatedForm';

export interface IValidatedImageProps {
    format: 'png' | 'jpg' | 'jpeg';
    name: string;
    value: string;
    aspectRatio?: number;
    width?: number;
    validators?: Validator[];
    openEditor: (params: { mime: string, data: string, aspectRatio: number, width: number }) => void;
}

interface IValidatedImageState {
    value: string;
    filename: string;
    resultFilename: string;
}

export default class ValidatedImage extends React.Component<IValidatedImageProps, IValidatedImageState> implements IValidatedControl {
    private _inputRef: HTMLInputElement = null;
    private _value: string = '';

    constructor(props: IValidatedImageProps) {
        super(props);
        this.state = {
            value: '',
            filename: '',
            resultFilename: ''
        };
    }

    componentDidMount() {
        if (this.context.form) {
            (this.context.form as ValidatedForm)._registerElement(this);
        }
    }

    componentWillUnmount() {
        if (this.context.form) {
            (this.context.form as ValidatedForm)._unregisterElement(this);
        }
    }

    componentWillReceiveProps(props: IValidatedImageProps) {
        if (this.props.value !== props.value) {
            this.setState({
                value: props.value as string,
                resultFilename: props.value ? this.state.filename : ''
            });
            this.onResult(props.value);
            (this.context.form as ValidatedForm).updateState(props.name, props.value);
        }
    }

    getValue() {
        return this._value;
    }

    onChange = (e: React.ChangeEvent<FormControl>) => {
        const target = (e.target as object as HTMLInputElement);
        if (target.files.length) {
            const file = target.files[0];
            readBinaryFile(file).then(r => {
                this.setState({
                    value: r,
                    filename: file.name
                });
                this.props.openEditor({
                    mime: this.resolveMIME(),
                    data: r,
                    aspectRatio: this.props.aspectRatio,
                    width: this.props.width
                });
            });
        }
        target.value = '';
    }

    onBrowse() {
        this._inputRef.click();
    }

    onBlur = (e: React.FocusEvent<FormControl>) => {
        (this.context.form as ValidatedForm).updateState(this.props.name);
    }

    onResult(data: string) {
        this._value = data;
        this.setState({
            value: data ? this.state.value : null,
            resultFilename: data ? this.state.filename : ''
        });
    }

    resolveMIME() {
        switch (this.props.format) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';

            default:
                return 'image/png';
        }
    }

    render() {
        return (
            <div className="input-group">
                <FormControl
                    className="hidden"
                    onChange={this.onChange}
                    onBlur={this.onBlur}
                    inputRef={ref => this._inputRef = ref}
                    type="file"
                    noValidate
                />
                <input type="text" className="form-control" readOnly value={this.state.resultFilename} />
                <div className="group-span-filestyle input-group-btn">
                    <button className="btn btn-default" style={{ border: 'solid 1px #dde6e9' }} type="button" onClick={this.onBrowse.bind(this)}>
                        <span className="text-muted icon-span-filestyle glyphicon glyphicon-folder-open" />
                        <span className="buttonText" />
                    </button>
                </div>
            </div>
        );
    }
}

(ValidatedImage as React.ComponentClass).contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};