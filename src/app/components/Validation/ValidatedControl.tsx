/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Form, FormControlProps } from 'react-bootstrap';
import { Validator } from './Validators';

import { IValidatedControl, ValidatedFormContext } from './ValidatedForm';
import { ValidatedFormGroupContext } from './ValidatedFormGroup';

type TFormControlElement = HTMLInputElement | HTMLTextAreaElement;

export interface IValidatedControlProps extends FormControlProps {
    name: string;
    validators?: Validator[];
    as?: React.ElementType;
}

interface IValidatedControlState {
    value: string;
}

export default class ValidatedControl extends React.Component<IValidatedControlProps, IValidatedControlState> implements IValidatedControl {
    static contextType = ValidatedFormContext;
    declare context: React.ContextType<typeof ValidatedFormContext>;

    // A controlled input mirrors what is typed into its value attribute, which CSS attribute
    // selectors can read ([value^="a"]): password fields stay uncontrolled and are written through
    // the DOM property only
    private _input = React.createRef<HTMLInputElement>();

    private get _secret() {
        return 'password' === this.props.type;
    }

    constructor(props: IValidatedControlProps) {
        super(props);

        this.state = {
            value: (props.value || props.defaultValue || '') as string
        };
    }

    componentDidMount() {
        if (this._secret && this._input.current) {
            this._input.current.value = this.state.value;
        }
        if (this.context.form) {
            this.context.form._registerElement(this);
        }
    }

    componentWillUnmount() {
        if (this.context.form) {
            this.context.form._unregisterElement(this);
        }
    }

    componentDidUpdate(prevProps: IValidatedControlProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value as string
            });
            if (this._secret && this._input.current && this._input.current.value !== (this.props.value || '')) {
                this._input.current.value = (this.props.value || '') as string;
            }
            if (this.context.form) {
                this.context.form.updateState(this.props.name, this.props.value);
            }
        }
    }

    getValue() {
        return this.state.value;
    }

    onChange = (e: React.ChangeEvent<TFormControlElement>) => {
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

    onBlur = (e: React.FocusEvent<TFormControlElement>) => {
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
                    <Form.Control
                        isInvalid={group.invalid}
                        style={this.props.style}
                        className={this.props.className}
                        readOnly={this.props.readOnly}
                        disabled={this.props.disabled}
                        onChange={this.onChange}
                        onBlur={this.onBlur}
                        size={this.props.size}
                        as={this.props.as}
                        id={this.props.id}
                        name={this.props.name}
                        type={this.props.type}
                        placeholder={this.props.placeholder}
                        ref={this._input}
                        value={this._secret ? undefined : this.state.value}
                    >
                        {this.props.children}
                    </Form.Control>
                )}
            </ValidatedFormGroupContext.Consumer>
        );
    }
}
