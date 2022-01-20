/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { initialize } from 'modules/engine/actions';

export interface IInitHookProps {

}

interface IInitHookState {

}

interface IInitHookDispatch {
    initialize: typeof initialize.started;
}

class InitHook extends React.Component<IInitHookProps & IInitHookState & IInitHookDispatch> {
    componentDidMount() {
        this.props.initialize({});
    }

    render() {
        return null as JSX.Element;
    }
}

const mapStateToProps = (state: IRootState) => ({

});

const mapDispatchToProps = {
    initialize: initialize.started
};

export default connect<IInitHookState, IInitHookDispatch, IInitHookProps>(mapStateToProps, mapDispatchToProps)(InitHook);