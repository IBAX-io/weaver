/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { TProtypoElement } from 'ibax/protypo';

import ProtypoConstructor from 'components/ProtypoConstructor';

export interface IProtypoConstructorContainerProps {
    section: string;
    editable?: boolean;
    wrapper?: JSX.Element;
    context: string;
    content: TProtypoElement[];
    changePage?: any;
    setTagCanDropPosition?: any;
    addTag?: any;
    moveTag?: any;
    copyTag?: any;
    removeTag?: any;
    selectTag?: any;
    selectedTag?: any;
    logic?: boolean;
}

interface IProtypoConstructorContainerState {
    apiHost: string;
    page: string;
}

interface IProtypoConstructorContainerDispatch {
}

const ProtypoConstructorContainer: React.SFC<IProtypoConstructorContainerState & IProtypoConstructorContainerDispatch & IProtypoConstructorContainerProps> = (props) => (
    <ProtypoConstructor {...props} />
);

const mapStateToProps = (state: IRootState, props: IProtypoConstructorContainerProps) => {
    const section = state.sections.sections[props.section];

    return {
        apiHost: state.auth.session && (state.auth.session.network.apiHost + '/api/v2'),
        page: section.page && section.page.name
    };
};

const mapDispatchToProps = {
};

export default connect<IProtypoConstructorContainerState, IProtypoConstructorContainerDispatch, IProtypoConstructorContainerProps>(mapStateToProps, mapDispatchToProps)(ProtypoConstructorContainer);