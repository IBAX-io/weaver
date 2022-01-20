/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Validator } from './Validators';
import * as propTypes from 'prop-types';

import ValidatedForm, { IValidatedControl } from './ValidatedForm';

export interface IValidatedRadioProps {
    validators?: Validator[];
    name: string;
    values: {
        title: string;
        value: string;
        disabled?: boolean;
    }[];
    className?: string;
    defaultChecked?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    checked?: string;
    disabled?: boolean;
}

interface IValidatedRadioState {
    checked: string;
}

export default class ValidatedRadioGroup extends React.Component<IValidatedRadioProps, IValidatedRadioState> implements IValidatedControl {
    constructor(props: IValidatedRadioProps) {
        super(props);

        this.state = {
            checked: props.checked || props.defaultChecked || null
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

    componentWillReceiveProps(props: IValidatedRadioProps) {
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
            checked: e.target.value
        });

        if (this.props.onChange) {
            this.props.onChange(e);
        }

        (this.context.form as ValidatedForm).emitUpdate(this.props.name, (e.target as any).value);
    }

    onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        (this.context.form as ValidatedForm).updateState(this.props.name);

        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    render() {
        return (
            <div>
                {this.props.values.map(value => (
                    <div className={`radio c-radio c-radio-nofont ${this.props.className || ''}`} key={value.value}>
                        <label>
                            <input
                                type="radio"
                                name={this.props.name}
                                value={value.value}
                                onChange={this.onChange}
                                onBlur={this.onBlur}
                                checked={this.state.checked === value.value}
                                disabled={value.disabled}
                            />
                            <em className="fa fa-circle" />
                            {value.title}
                        </label>
                    </div>
                ))}
            </div>
        );
    }
}

(ValidatedRadioGroup as React.ComponentClass).contextTypes = {
    form: propTypes.instanceOf(ValidatedForm)
};