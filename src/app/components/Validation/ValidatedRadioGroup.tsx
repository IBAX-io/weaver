/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Validator } from './Validators';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';

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
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    constructor(props: IValidatedRadioProps) {
        super(props);

        this.state = {
            checked: props.checked || props.defaultChecked || null
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

    componentDidUpdate(prevProps: IValidatedRadioProps) {
        if (prevProps.checked !== this.props.checked) {
            this.setState({
                checked: this.props.checked
            });
            if (this.context.form) {
                this.context.form.updateState(this.props.name, this.props.checked);
            }
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

        if (this.context.form) {
            this.context.form.emitUpdate(this.props.name, e.target.value);
        }
    }

    onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (this.context.form) {
            this.context.form.updateState(this.props.name);
        }

        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    render() {
        return (
            <div>
                {this.props.values.map(value => (
                    <div className={`form-check c-radio c-radio-nofont ${this.props.className || ''}`} key={value.value}>
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
