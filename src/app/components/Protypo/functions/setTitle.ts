/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import Protypo from '../';

export interface ISetTitleProps {
    title: string;
}

const setTitle = (context: Protypo, props: ISetTitleProps) => {
    context.setTitle(props.title);
};

export default setTitle;