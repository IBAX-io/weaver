/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import { resolveHandler, resolveFunction } from 'components/Protypo';
import contextDefinitions from './contexts';
import { ProtypoContext, IProtypoContextValue } from './ProtypoContext';
import { TProtypoElement, ISource } from 'ibax/protypo';
import { IValidationResult } from 'components/Validation/ValidatedForm';
import Heading from './components/Heading';
import ToolButton, { IToolButtonProps } from 'containers/ToolButton/ToolButton';
import { IConstructorElementProps } from 'ibax/editor';

export interface IProtypoProps extends IConstructorElementProps {
    apiHost: string;
    wrapper?: React.JSX.Element;
    context: string;
    page?: string;
    menu?: string;
    section: string;
    content: TProtypoElement[];
    menuPush: IProtypoContextValue['menuPush'];
    displayData: (link: string) => void;
}

export interface IParamsSpec {
    [key: string]: IParamSpec;
}

export interface IParamSpec {
    type: string;
    text?: string;
    params: string[];
}

class Protypo extends React.Component<IProtypoProps> {
    private _lastID: number;
    private _title: string;
    private _toolButtons: IToolButtonProps[];
    private _sources: { [key: string]: ISource };
    private _errors: { name: string, description: string }[];
    private _contextValue: IProtypoContextValue = null;

    getContextValue = (): IProtypoContextValue => {
        if (!this._contextValue || this._contextValue.section !== this.props.section || this._contextValue.menuPush !== this.props.menuPush) {
            this._contextValue = {
                protypo: this,
                section: this.props.section,
                menuPush: this.props.menuPush,
                resolveSource: this.resolveSource,
                resolveText: this.resolveText,
                getFromContext: this.getFromContext,
                renderElements: this.renderElements
            };
        }
        return this._contextValue;
    }

    getFromContext: IProtypoContextValue['getFromContext'] = computeTitle => {
        const title = computeTitle ? this.resolveText(computeTitle) : '';

        if (this.props.page) {
            return {
                type: 'PAGE',
                section: this.props.section,
                title: title || this.props.page,
                name: this.props.page
            };
        }
        else if (this.props.menu) {
            return {
                type: 'MENU',
                section: this.props.section,
                title: title || this.props.menu,
                name: this.props.menu
            };
        }
        else {
            return undefined;
        }
    }

    getCurrentPage = () => {
        return this.props.page;
    }

    setTitle = (title: string) => {
        this._title = title;
    }

    addToolButton = (props: IToolButtonProps) => {
        this._toolButtons.push(props);
    }

    displayData = (link: string) => {
        this.props.displayData(link);
    }

    registerSource = (name: string, payload: ISource) => {
        this._sources[name] = payload;
    }

    resolveSource = (name: string) => {
        return this._sources[name];
    }

    resolveData = (name: string) => {
        return `${this.props.apiHost}${name}`;
    }

    resolveParams = (values: IParamsSpec, formValues?: { [key: string]: IValidationResult }) => {
        const result: { [key: string]: string } = {};
        for (let itr in values) {
            if (values.hasOwnProperty(itr)) {
                const param = values[itr];
                switch (param.type) {
                    case 'text': result[itr] = param.text; break;
                    case 'Val':
                        const inputName = param.params[0];
                        const inputValue = formValues && formValues[inputName] && formValues[inputName].value;
                        result[itr] = inputValue;
                        break;
                    default: break;
                }
            }
        }
        return result;
    }

    resolveText = (value: React.ReactNode) => {
        let result = '';
        if (value) {
            if ('string' === typeof value || 'number' === typeof value) {
                result += value;
            }
            else if ('object' === typeof value) {
                let children = null;
                if (Array.isArray(value)) {
                    children = value;
                }
                else if (React.isValidElement<{ children?: React.ReactNode }>(value)) {
                    children = value.props.children;
                }
                if (children) {
                    if (Array.isArray(children)) {
                        children.forEach(o => {
                            result += this.resolveText(o);
                        });
                    } else {
                        result += this.resolveText(children);
                    }
                }
            }
        }
        return result;
    }

    renderElement = (element: TProtypoElement, optionalKey?: string): React.ReactNode => {
        switch (element.tag) {
            case 'text':
                return element.text;

            default:
                const Handler = resolveHandler(element.tag);
                const func = resolveFunction(element.tag);
                if (Handler) {
                    if (-1 !== contextDefinitions[this.props.context].disabledHandlers.indexOf(element.tag)) {
                        return null;
                    }
                    else {
                        const key = optionalKey || (this._lastID++).toString();

                        return (
                            <Handler
                                {...element.attr}
                                key={key}
                                id={key}
                                childrenTree={element.children}
                            >
                                {this.renderElements(element.children)}
                            </Handler>
                        );
                    }
                }
                else if (func) {
                    if (-1 !== contextDefinitions[this.props.context].disabledFunctions.indexOf(element.tag)) {
                        return null;
                    }
                    else {
                        func(this, { ...element.attr });
                        return null;
                    }
                }
                else {
                    this._errors.push({
                        name: 'E_UNREGISTERED_HANDLER',
                        description: `Unknown template handler '${element.tag}'. This error must be reported`
                    });
                    return null;
                }
        }
    }

    renderElements = (elements: TProtypoElement[], keyPrefix?: string): React.ReactNode[] => {
        if (!elements) {
            return [];
        }

        return elements.map((element, index) => (
            this.renderElement(element, keyPrefix ? `${keyPrefix}_${index}` : undefined)
        ));
    }

    renderHeading = () => {
        return (this.props.context === 'page' && this._title) ? (
            <Heading key="func_heading">
                <span>{this._title}</span>
                <div className="float-end">
                    {this._toolButtons.map((props, index) => (
                        <ToolButton {...props} key={index} />
                    ))}
                </div>
            </Heading>
        ) : null;
    }

    render() {
        this._lastID = 0;
        this._sources = {};
        this._toolButtons = [];
        this._title = null;
        this._errors = [];

        const body = this.renderElements(this.props.content);
        const head = this.renderHeading();
        const children = [
            this._errors.length ? (
                <div key="errors">
                    {this._errors.map((error, errorIndex) => (
                        <div key={errorIndex} className="alert alert-danger">
                            <strong>[{error.name}]</strong>
                            <span className="mr">:</span>
                            <span>{error.description}</span>
                        </div>
                    ))}
                </div>
            ) : null,
            head,
            ...body
        ];

        const content = this.props.wrapper ?
            React.cloneElement(
                this.props.wrapper,
                { className: classNames(this.props.wrapper.props.className, 'protypo-content') },
                children
            ) : (
                <div className="fullscreen protypo-content">
                    {children}
                </div>
            );

        return (
            <ProtypoContext.Provider value={this.getContextValue()}>
                {content}
            </ProtypoContext.Provider>
        );
    }
}

export default Protypo;
