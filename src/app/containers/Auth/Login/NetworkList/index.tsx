/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { discoverNetwork, navigate } from 'modules/engine/actions';
import { INetwork } from 'ibax/auth';

import NetworkList from 'components/Auth/Login/NetworkList';
import { modalShow } from 'modules/modal/actions';

const sortNetworks = (a: INetwork, b: INetwork) =>
    a.uuid < b.uuid ? 1 : -1;

const selectNetworks = (state: IRootState) => {
    const preconfiguredNetworks = state.storage.networks.filter(l =>
        !!state.engine.preconfiguredNetworks.find(n => n.uuid === l.uuid)
    ).sort(sortNetworks);

    const savedNetworks = state.storage.networks.filter(l =>
        !state.engine.preconfiguredNetworks.find(n => n.uuid === l.uuid)
    ).sort(sortNetworks);

    return {
        preconfiguredNetworks,
        networks: savedNetworks
    };
};

const mapStateToProps = (state: IRootState) => ({
    pending: state.engine.isConnecting,
    current: state.engine.guestSession && state.engine.guestSession.network,
    ...selectNetworks(state)
});

export default connect(mapStateToProps, {
    onConnect: (uuid: string) => discoverNetwork.started({ uuid }),
    onAddNetwork: () => navigate('/networks/add'),
    onRemove: (network: INetwork) => modalShow({
        id: 'REMOVE_NETWORK',
        type: 'REMOVE_NETWORK',
        params: {
            uuid: network.uuid,
            name: network.name
        }
    })

})(NetworkList);