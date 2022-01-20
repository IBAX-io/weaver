/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { FormControl, FormControlProps } from 'react-bootstrap';
import { Validator } from './Validators';
import * as propTypes from 'prop-types';

import ValidatedForm, { IValidatedControl } from './ValidatedForm';

export interface IValidatedControlProps extends FormControlProps {
    name: string;
    validators?: Validator[];
}

interface IValidatedControlState {
    value: string;
}

export default class ValidatedControl extends React.Component<IValidatedControlProps, IValidatedControlState> implements IValidatedControl {
    constructor(props: IValidatedControlProps) {
        super(props);

        this.state = {
            value: (props.value || props.defaultValue || '') as string
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

    componentWillReceiveProps(props: IValidatedControlProps) {
        if (this.props.value !== props.value) {
            this.setState({
                value: props.value as string
            });
            (this.context.form as ValidatedForm).updateState(props.name, props.value);
        }
    }

    getValue() {
        return this.state.value;
    }

    onChange = (e: React.ChangeEvent<FormControl>) => {
        this.setState({
            value: (e.target as any).value
        });

        if (this.props.onChange) {
            this.props.onChange(e);
        }

        (this.context.form as ValidatedForm).emitUpdate(this.props.name, (e.target as any).value);
    }

    onBlur = (e: React.FocusEvent<FormControl>) => {
        if (this.context.form) {
            (this.context.form as ValidatedForm).updateState(this.props.name);
        }

        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    render() {
        return (
            <FormControl
                style={this.props.style}
                className={this.props.className}
                readOnly={this.props.readOnly}
                disabled={this.props.disabled}
                onChange={this.onChange}
                onBlur={this.onBlur}
                bsClass={this.props.bsClass}
                bsSize={this.props.bsSize}
                componentClass={this.props.componentClass}
                id={this.props.id}
                name={this.props.name}
                inputRef={this.props.inputRef}
                type={this.props.type}
                placeholder={this.props.placeholder}
                value={this.state.value}
                noValidate
            >
                {this.props.children}
            </FormControl>
        );
    }
}

(ValidatedControl as React.ComponentClass).contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};