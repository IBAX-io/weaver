/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { IRootState } from 'modules';
import { connect } from 'react-redux';

import Heading from 'components/Auth/Heading';
import NetworkIndicator from 'components/Auth/Heading/NetworkIndicator';

const mapStateToProps = (state: IRootState) => {
    const network = state.engine.guestSession &&
        state.engine.guestSession.network &&
        state.storage.networks.find(l => l.uuid === state.engine.guestSession.network.uuid);

    return {
        option: React.createElement(NetworkIndicator, {
            navigateUrl: '/networks',
            status: state.engine.isConnecting ? 'PENDING' : network ? 'ONLINE' : 'OFFLINE'
        }, network && network.name) as React.ReactNode
    };
};

export default connect(mapStateToProps, {

})(Heading);