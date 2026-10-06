/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Validator } from './Validators';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';

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
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    constructor(props: IValidatedCheckboxProps) {
        super(props);

        this.state = {
            checked: props.checked || props.defaultChecked || false
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

    componentDidUpdate(prevProps: IValidatedCheckboxProps) {
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
            checked: e.target.checked
        });

        if (this.props.onChange) {
            this.props.onChange(e);
        }

        if (this.context.form) {
            this.context.form.emitUpdate(this.props.name, String(e.target.checked));
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
            <div className={`form-check c-checkbox ${this.props.className || ''}`}>
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
