/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Form } from 'react-bootstrap';
import { Validator } from './Validators';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';

export interface IValidatedFileProps {
    name: string;
    value?: File;
    disabled?: boolean;
    placeholder?: string;
    validators?: Validator[];
}

interface IValidatedFileState {
    value: File;
    filename: string;
}

export default class ValidatedFile extends React.Component<IValidatedFileProps, IValidatedFileState> implements IValidatedControl {
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    private _inputRef = React.createRef<HTMLInputElement>();

    constructor(props: IValidatedFileProps) {
        super(props);
        this.state = {
            value: null,
            filename: ''
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

    componentDidUpdate(prevProps: IValidatedFileProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value,
                filename: this.props.value ? this.state.filename : ''
            });
            if (this.context.form) {
                this.context.form.updateState(this.props.name, this.props.value);
            }
        }
    }

    getValue() {
        return this.state.value;
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        if (target.files.length) {
            const file = target.files[0];
            this.setState({
                value: file,
                filename: file.name
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
                <input type="text" className="form-control" readOnly value={this.state.filename} placeholder={this.props.placeholder} />
                <button className="btn btn-secondary" style={{ border: 'solid 1px #dde6e9' }} type="button" disabled={this.props.disabled} onClick={this.onBrowse.bind(this)}>
                    <span className="text-muted fa fa-folder-open" />
                </button>
            </div>
        );
    }
}
