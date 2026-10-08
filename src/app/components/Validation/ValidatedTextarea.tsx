/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import classnames from 'classnames';
import { Validator } from './Validators';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';
import { ValidatedFormGroupContext } from './ValidatedFormGroup';

export interface IValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    name: string;
    validators?: Validator[];
}

interface IValidatedTextareaState {
    value: string;
}

export default class ValidatedTextarea extends React.Component<IValidatedTextareaProps, IValidatedTextareaState> implements IValidatedControl {
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    constructor(props: IValidatedTextareaProps) {
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

    componentDidUpdate(prevProps: IValidatedTextareaProps) {
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

    onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
                    <textarea
                        id={this.props.id}
                        className={classnames('form-control', this.props.className, { 'is-invalid': group.invalid })}
                        placeholder={this.props.placeholder}
                        value={this.state.value}
                        onChange={this.onChange}
                        onBlur={this.onBlur}
                    />
                )}
            </ValidatedFormGroupContext.Consumer>
        );
    }
}
