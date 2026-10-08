/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Form, FormProps } from 'react-bootstrap';
import { Validator } from './Validators';

export interface IValidatedFormProps extends FormProps {
    pending?: boolean;
    onSubmitSuccess?: (payload: { [key: string]: string }) => void;
    onSubmitError?: (payload: { [key: string]: IValidationResult }) => void;
}

export interface IValidatedFormState {
    payload: {
        [key: string]: {
            dirty: boolean;
            invalid: boolean;
        };
    };
}

export interface IValidationResult {
    name: string;
    index?: number;
    error: boolean;
    validator?: Validator;
    value?: any;
}

export interface IValidatedControl {
    getValue: () => any;
    props: {
        name: string;
        validators?: Validator[];
    };
}

interface IValidationElement {
    name: string;
    node: IValidatedControl;
    validators: Validator[];
}

interface IFormListener {
    (e: IValidationResult): void;
}

export interface IValidatedFormContext {
    form: ValidatedForm | null;
}

export const ValidatedFormContext = React.createContext<IValidatedFormContext>({ form: null });

export default class ValidatedForm extends React.Component<IValidatedFormProps, IValidatedFormState> {
    private _elements: {
        [name: string]: IValidationElement[];
    } = {};
    private _listeners: IFormListener[] = [];

    constructor(props: IValidatedFormProps) {
        super(props);
        this.state = {
            payload: {}
        };
    }

    _registerElement(node: IValidatedControl) {
        const name = node.props.name;

        if (!this._elements[name]) {
            this._elements[name] = [];
        }

        this._elements[name].push({
            name,
            node,
            validators: node.props.validators
        });
    }

    _unregisterElement(node: IValidatedControl) {
        const name = node.props.name;

        if (this._elements[name]) {
            const index = this._elements[name].findIndex(l => l.node === node);
            if (-1 !== index) {
                this._elements[name].splice(index);
            }

            if (0 === this._elements[name].length) {
                delete this._elements[name];
            }
        }
    }

    private _onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const payload = this.validateAll();

        if (payload.valid && this.props.onSubmitSuccess) {
            const values = {};
            for (let itr in payload.payload) {
                if (payload.payload.hasOwnProperty(itr)) {
                    values[itr] = payload.payload[itr] && payload.payload[itr].value;
                }
            }
            this.props.onSubmitSuccess(values);
        }
        else if (!payload.valid && this.props.onSubmitError) {
            this.props.onSubmitError(payload.payload);
        }
    }

    onUpdate(listener: IFormListener) {
        this._listeners.push(listener);

        Object.keys(this._elements).forEach(input =>
            this._elements[input].forEach(l => {
                const result = this.validate(input, l.node.getValue());
                listener(result);
            })
        );
    }

    isPending() {
        return this.props.pending;
    }

    updateState(name: string, value?: any) {
        const result = this.emitUpdate(name, value);
        this._listeners.forEach(l => l(result));
        this.setState({
            payload: {
                ...this.state.payload,
                [name]: {
                    dirty: true,
                    invalid: result.error
                }
            }
        });
    }

    emitUpdate(name: string, value?: any) {
        const result = this.validate(name, value);
        this._listeners.forEach(l => l(result));
        return result;
    }

    getState(name: string) {
        const value = this.state.payload[name];
        return (!value || !value.dirty || !value.invalid);
    }

    validate(name: string, withValue?: any): IValidationResult {
        const elements = this._elements[name];
        if (!elements) {
            return {
                name,
                error: false,
                value: null
            };
        }

        const results: any[] = [];
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const value = withValue || element.node.getValue();

            if (element.validators) {
                for (let v = 0; v < element.validators.length; v++) {
                    const validator = element.validators[v];

                    if (!validator.validate(value)) {
                        return {
                            name,
                            index: v,
                            error: true,
                            validator
                        };
                    }
                }
            }
            results.push(value);
        }

        if (1 < results.length) {
            return {
                name,
                error: false,
                value: results
            };
        }
        else {
            return {
                name,
                error: false,
                value: results[0]
            };
        }
    }

    validateAll(): { valid: boolean, payload: { [key: string]: IValidationResult } } {
        const values = {
            valid: true,
            payload: {}
        };
        const payload = {
            ...this.state.payload
        };

        for (let itr in this._elements) {
            if (this._elements.hasOwnProperty(itr)) {
                const error = this.validate(itr);
                values.payload[itr] = error;
                if (error) {
                    if (error.error) {
                        values.valid = false;
                    }
                    payload[itr] = {
                        dirty: true,
                        invalid: error.error
                    };
                }
            }
        }
        this.setState({
            payload
        });
        return values;
    }

    render() {
        // A new context value on every render re-renders all consumers, so controls that read
        // getState() pick up the form's validation state after each update.
        return (
            <ValidatedFormContext.Provider value={{ form: this }}>
                <Form
                    autoComplete="off"
                    className={this.props.className}
                    onSubmit={this._onSubmit.bind(this)}
                    as={this.props.as}
                >
                    {this.props.children}
                </Form>
            </ValidatedFormContext.Provider>
        );
    }
}
