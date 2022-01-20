/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Validator } from './Validators';
import * as propTypes from 'prop-types';

import ValidatedForm, { IValidatedControl } from './ValidatedForm';

export interface IValidatedSelectProps {
    id?: string;
    name: string;
    className?: string;
    validators?: Validator[];
    disabled?: boolean;
    value?: string;
    defaultValue?: string;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
    onBlur?: React.FocusEventHandler<HTMLSelectElement>;
}

interface IValidatedSelectState {
    value: string;
}

export default class ValidatedSelect extends React.Component<IValidatedSelectProps, IValidatedSelectState> implements IValidatedControl {
    constructor(props: IValidatedSelectProps) {
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

    componentWillReceiveProps(props: IValidatedSelectProps) {
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

    onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({
            value: e.target.value
        });

        if (this.props.onChange) {
            this.props.onChange(e);
        }

        (this.context.form as ValidatedForm).emitUpdate(this.props.name, (e.target as any).value);
    }

    onBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
        (this.context.form as ValidatedForm).updateState(this.props.name);

        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    render() {
        return (
            <select
                id={this.props.id}
                className={`form-control ${this.props.className || ''}`}
                disabled={this.props.disabled}
                name={this.props.name}
                value={this.state.value}
                onChange={this.onChange}
                onBlur={this.onBlur}
            >
                {this.props.children}
            </select>
        );
    }
}

(ValidatedSelect as React.ComponentClass).contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};