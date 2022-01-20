/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Validator } from './Validators';
import * as propTypes from 'prop-types';

import ValidatedForm, { IValidatedControl } from './ValidatedForm';

export interface IValidatedCheckboxProps {
    validators?: Validator[];
    name: string;
    title?: React.ReactNode;
    className?: string;
    defaultChecked?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    checked?: boolean;
    disabled?: boolean;
}

interface IValidatedCheckboxState {
    checked: boolean;
}

export default class ValidatedCheckbox extends React.Component<IValidatedCheckboxProps, IValidatedCheckboxState> implements IValidatedControl {
    constructor(props: IValidatedCheckboxProps) {
        super(props);

        this.state = {
            checked: props.checked || props.defaultChecked || false
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

    componentWillReceiveProps(props: IValidatedCheckboxProps) {
        if (this.props.checked !== props.checked) {
            this.setState({
                checked: props.checked
            });
            (this.context.form as ValidatedForm).updateState(props.name, props.checked);
        }
    }

    getValue() {
        return this.state.checked;
    }

    onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            checked: e.target.checked
        });

        if (this.props.onChange) {
            this.props.onChange(e);
        }

        (this.context.form as ValidatedForm).emitUpdate(this.props.name, String(e.target.checked));
    }

    onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        (this.context.form as ValidatedForm).updateState(this.props.name);

        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    render() {
        return (
            <div className={`checkbox c-checkbox ${this.props.className || ''}`}>
                <label>
                    <input
                        type="checkbox"
                        name={this.props.name}
                        onChange={this.onChange}
                        onBlur={this.onBlur}
                        checked={this.state.checked}
                        disabled={this.props.disabled}
                    />
                    <em className="fa fa-check" />
                    <span>{this.props.title}</span>
                </label>
            </div>
        );
    }
}

(ValidatedCheckbox as React.ComponentClass).contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};