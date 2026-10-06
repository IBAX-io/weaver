/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import StyledComponent from './StyledComponent';

import { IParamsSpec } from '../Protypo';
import { ProtypoContext } from '../ProtypoContext';
import { ProtypoFormContext } from './Form';
import TxButton from 'containers/Button/TxButton';
import { IErrorRedirect } from 'ibax/protypo';

export interface IButtonProps {
    'class'?: string;
    'className'?: string;
    'action'?: {
        name: string;
        params?: { [key: string]: string };
    }[];
    'alert'?: {
        icon: string;
        text: string;
        confirmbutton: string;
        cancelbutton: string;
    };
    'contract'?: string;
    'composite'?: {
        name: string;
        data: {
            [key: string]: any;
        }[]
    }[];
    'popup'?: {
        header?: string;
        width?: string;
    };
    'page'?: string;
    'pageparams'?: IParamsSpec;
    'params'?: IParamsSpec;
    'formID'?: number;

    errredirect?: {
        [key: string]: IErrorRedirect
    };
}

const Button: React.FC<React.PropsWithChildren<IButtonProps>> = props => {
    const intl = useIntl();
    const { protypo, section } = useContext(ProtypoContext);
    const { form } = useContext(ProtypoFormContext);

    const getParams = () => {
        const params = {};

        if (form) {
            const payload = form.validateAll();
            if (!payload.valid) {
                return null;
            }

            for (let itr in payload.payload) {
                if (payload.payload.hasOwnProperty(itr)) {
                    params[itr] = payload.payload[itr].value;
                }
            }

            return {
                ...params,
                ...protypo.resolveParams(props.params, payload.payload)
            };
        }

        return {
            ...params,
            ...protypo.resolveParams(props.params)
        };
    };

    const getPageParams = () => {
        if (form) {
            const payload = form.validateAll();
            if (!payload.valid) {
                return null;
            }

            return protypo.resolveParams(props.pageparams, payload.payload);
        }
        else {
            return protypo.resolveParams(props.pageparams);
        }
    };

    const getErrorRedirectParams = () => {
        const result: { [key: string]: IErrorRedirect } = {};

        if (!props.errredirect) {
            return {};
        }

        for (let itr in props.errredirect) {
            if (props.errredirect.hasOwnProperty(itr)) {
                let pageparams = null;
                if (form) {
                    const payload = form.validateAll();
                    if (payload.valid) {
                        pageparams = protypo.resolveParams(props.errredirect[itr].pageparams, payload.payload);

                    }
                }
                else {
                    pageparams = protypo.resolveParams(props.errredirect[itr].pageparams);
                }
                result[itr] = {
                    pagename: props.errredirect[itr].pagename,
                    pageparams
                };
            }
        }
        return result;
    };

    let popup: { title?: string, width?: number } = null;
    if (props.popup) {
        const width = parseInt(props.popup.width, 10);
        popup = {
            title: props.popup.header,
            width: width === width ? width : null
        };
    }

    return (
        <TxButton
            className={[props.class, props.className].join(' ')}
            actions={props.action || []}
            confirm={props.alert && {
                icon: props.alert.icon,
                title: intl.formatMessage({ id: 'alert.confirmation', defaultMessage: 'Confirmation' }),
                text: props.alert.text,
                confirmButton: props.alert.confirmbutton,
                cancelButton: props.alert.cancelbutton
            }}
            contracts={props.composite && props.composite.map(tx => ({
                name: tx.name,
                params: tx.data
            }))}
            from={protypo.getFromContext(props.children)}
            contract={props.contract}
            contractParams={getParams}
            page={props.page}
            section={section}
            pageParams={getPageParams}
            popup={popup}
            errorRedirects={getErrorRedirectParams}
        >
            {props.children}
        </TxButton>
    );
};

export default StyledComponent(Button);