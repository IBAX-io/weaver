/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as _ from 'lodash';
import * as propTypes from 'prop-types';

import Protypo from '../Protypo';
import StyledComponent from './StyledComponent';
import Validation from 'components/Validation';
import { Validator } from 'components/Validation/Validators';

export interface ISelectProps {
    'className'?: string;
    'class'?: string;
    'source'?: string;
    'namecolumn'?: string;
    'valuecolumn'?: string;
    'value'?: string;
    'name'?: string;
    'validate'?: {
        [validator: string]: string
    };
}

interface ISelectContext {
    protypo: Protypo;
}

const Select: React.SFC<ISelectProps> = (props, context: ISelectContext) => {
    const compiledValidators: Validator[] = [];
    _.forEach(props.validate, (value, name) => {
        const validator = Validation.validators[name];
        if (validator) {
            compiledValidators.push(validator(value));
        }
    });

    const source = context.protypo.resolveSource(props.source);
    let options: { name: string, value: string }[] = [];
    if (source) {
        const nameIndex = source.columns.indexOf(props.namecolumn);
        const valueIndex = source.columns.indexOf(props.valuecolumn);
        const nameType = source.types[nameIndex];

        options = source.data.map(row => {
            let name: any = null;
            switch (nameType) {
                // Default is on top because of linter bug that is warning about break statement
                default:
                    name = ''; break;

                case 'text':
                    name = row[nameIndex]; break;

                case 'tags':
                    try {
                        const payload = JSON.parse(row[nameIndex]);
                        name = context.protypo.renderElements(payload);
                        break;
                    }
                    catch (e) {
                        break;
                    }
            }

            return {
                name,
                value: row[valueIndex]
            };
        });
    }

    const defaultValue = (props.value && options.find(l => l.value === props.value)) ?
        props.value : null;

    return (
        <Validation.components.ValidatedSelect
            className={[props.class, props.className].join(' ')}
            name={props.name}
            validators={compiledValidators}
            defaultValue={defaultValue || (options && options.length && options[0].value)}
        >
            {options.map((l, index) => (
                <option key={index} value={l.value}>
                    {l.name}
                </option>
            ))}
        </Validation.components.ValidatedSelect>
    );
};

Select.contextTypes = {
    protypo: propTypes.object.isRequired
};

export default StyledComponent(Select);