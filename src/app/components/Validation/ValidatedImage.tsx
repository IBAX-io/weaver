/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Form } from 'react-bootstrap';
import { Validator } from './Validators';
import { readBinaryFile } from 'lib/fs';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';

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
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    private _inputRef = React.createRef<HTMLInputElement>();
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
            this.context.form._registerElement(this);
        }
    }

    componentWillUnmount() {
        if (this.context.form) {
            this.context.form._unregisterElement(this);
        }
    }

    componentDidUpdate(prevProps: IValidatedImageProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value as string,
                resultFilename: this.props.value ? this.state.filename : ''
            });
            this.onResult(this.props.value);
            if (this.context.form) {
                this.context.form.updateState(this.props.name, this.props.value);
            }
        }
    }

    getValue() {
        return this._value;
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
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
        this._inputRef.current.click();
    }

    onBlur = () => {
        if (this.context.form) {
            this.context.form.updateState(this.props.name);
        }
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
                <Form.Control
                    className="d-none"
                    onChange={this.onChange}
                    onBlur={this.onBlur}
                    ref={this._inputRef}
                    type="file"
                />
                <input type="text" className="form-control" readOnly value={this.state.resultFilename} />
                <button className="btn btn-secondary" style={{ border: 'solid 1px #dde6e9' }} type="button" onClick={this.onBrowse.bind(this)}>
                    <span className="text-muted fa fa-folder-open" />
                </button>
            </div>
        );
    }
}
