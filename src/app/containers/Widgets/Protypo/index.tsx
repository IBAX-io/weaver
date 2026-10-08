/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { displayData } from 'modules/content/actions';
import { menuPush } from 'modules/sections/actions';
import { TProtypoElement } from 'ibax/protypo';
import Protypo from 'components/Protypo';
import { signedInSession } from 'modules/auth/selectors';

export interface IProtypoProps {
    wrapper?: React.JSX.Element;
    context: string;
    page?: string;
    menu?: string;
    section: string;
    content: TProtypoElement[];
}

const mapStateToProps = (state: IRootState, props: IProtypoProps) => ({
    apiHost: signedInSession(state) && (signedInSession(state).network.apiHost + '/api/v2'),
    page: props.page,
    ...props
});

const connector = connect(mapStateToProps, {
    menuPush,
    displayData: displayData.started
});

export default connector(Protypo);