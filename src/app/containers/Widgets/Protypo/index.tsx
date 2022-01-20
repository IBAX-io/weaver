/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { displayData } from 'modules/content/actions';
import { menuPush } from 'modules/sections/actions';
import { TProtypoElement } from 'ibax/protypo';

export interface IProtypoProps {
    wrapper?: JSX.Element;
    context: string;
    page?: string;
    menu?: string;
    section: string;
    content: TProtypoElement[];
}

import Protypo from 'components/Protypo';

const mapStateToProps = (state: IRootState, props: IProtypoProps) => ({
    apiHost: state.auth.session && (state.auth.session.network.apiHost + '/api/v2'),
    page: props.page,
    ...props
});

export default connect(mapStateToProps, {
    menuPush,
    displayData: displayData.started

})(Protypo as any);