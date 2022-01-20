/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import propTypes from 'prop-types';
import StyledComponent from './StyledComponent';
import ValidatedForm from 'components/Validation/ValidatedForm';
import InteractionManager, { TConditionMap } from '../interaction';

export interface IFormProps {
    'class'?: string;
    'className'?: string;
}

interface IFormState {
    form: ValidatedForm;
    conditionMap: {
        [id: string]: TConditionMap;
    };
}

class Form extends React.Component<IFormProps, IFormState> {
    private _interactionManager = new InteractionManager();

    static childContextTypes = {
        form: propTypes.instanceOf(ValidatedForm),
        interactionManager: propTypes.instanceOf(InteractionManager),
        conditionMap: propTypes.object
    };

    constructor(props: IFormProps) {
        super(props);
        this.state = {
            form: null,
            conditionMap: {}
        };
    }

    getChildContext() {
        return {
            form: this.state.form,
            interactionManager: this._interactionManager,
            conditionMap: this.state.conditionMap
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
        return (
            <ValidatedForm ref={this.bindForm.bind(this)} className={[this.props.class, this.props.className].join(' ')}>
                {this.props.children}
            </ValidatedForm>
        );
    }
}

export default StyledComponent(Form);