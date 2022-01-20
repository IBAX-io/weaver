/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IParamsSpec } from 'components/Protypo/Protypo';

export interface IAddToolButtonProps {
    title?: string;
    icon?: string;
    page?: string;
    pageparams?: IParamsSpec;
}

const addToolButton = (context: any, props: IAddToolButtonProps) => {
    context.addToolButton({
        ...props,
        section: context.section,
        pageparams: context.resolveParams(props.pageparams)
    });
};

export default addToolButton;