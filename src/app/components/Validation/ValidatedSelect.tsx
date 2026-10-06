/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import classnames from 'classnames';
import { Validator } from './Validators';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';
import { ValidatedFormGroupContext } from './ValidatedFormGroup';

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
    children?: React.ReactNode;
}

interface IValidatedSelectState {
    value: string;
}

export default class ValidatedSelect extends React.Component<IValidatedSelectProps, IValidatedSelectState> implements IValidatedControl {
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    constructor(props: IValidatedSelectProps) {
        super(props);

        this.state = {
            value: (props.value || props.defaultValue || '') as string
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

    componentDidUpdate(prevProps: IValidatedSelectProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value as string
            });
            if (this.context.form) {
                this.context.form.updateState(this.props.name, this.props.value);
            }
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

        if (this.context.form) {
            this.context.form.emitUpdate(this.props.name, e.target.value);
        }
    }

    onBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
        if (this.context.form) {
            this.context.form.updateState(this.props.name);
        }

        if (this.props.onBlur) {
            this.props.onBlur(e);
        }
    }

    render() {
        return (
            <ValidatedFormGroupContext.Consumer>
                {group => (
                    <select
                        id={this.props.id}
                        className={classnames('form-select', this.props.className, { 'is-invalid': group.invalid })}
                        disabled={this.props.disabled}
                        name={this.props.name}
                        value={this.state.value}
                        onChange={this.onChange}
                        onBlur={this.onBlur}
                    >
                        {this.props.children}
                    </select>
                )}
            </ValidatedFormGroupContext.Consumer>
        );
    }
}
