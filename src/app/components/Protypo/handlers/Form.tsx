/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import StyledComponent from './StyledComponent';
import ValidatedForm from 'components/Validation/ValidatedForm';
import InteractionManager, { TConditionMap } from '../interaction';

export interface IFormProps {
    'class'?: string;
    'className'?: string;
    children?: React.ReactNode;
}

export interface IProtypoFormContextValue {
    form: ValidatedForm;
    interactionManager: InteractionManager;
    conditionMap: { [id: string]: TConditionMap };
}

// Provided by the protypo Form handler to its descendants (buttons and interactive components)
export const ProtypoFormContext = React.createContext<IProtypoFormContextValue>({
    form: null,
    interactionManager: null,
    conditionMap: null
});
ProtypoFormContext.displayName = 'ProtypoFormContext';

interface IFormState {
    form: ValidatedForm;
    conditionMap: {
        [id: string]: TConditionMap;
    };
}

class Form extends React.Component<IFormProps, IFormState> {
    private _interactionManager = new InteractionManager();

    constructor(props: IFormProps) {
        super(props);
        this.state = {
            form: null,
            conditionMap: {}
        };
    }

    bindForm(form: ValidatedForm) {
        if (!this.state.form) {
            this.setState({
                form
            });
            form.onUpdate(e => {
                this._interactionManager.on('input_change', {
                    name: e.name,
                    value: String(e.value)
                });

                this.setState({
                    conditionMap: this._interactionManager.getConditionMap()
                });
            });
        }
    }

    render() {
        const context: IProtypoFormContextValue = {
            form: this.state.form,
            interactionManager: this._interactionManager,
            conditionMap: this.state.conditionMap
        };

        return (
            <ProtypoFormContext.Provider value={context}>
                <ValidatedForm ref={this.bindForm.bind(this)} className={[this.props.class, this.props.className].join(' ')}>
                    {this.props.children}
                </ValidatedForm>
            </ProtypoFormContext.Provider>
        );
    }
}

export default StyledComponent(Form);