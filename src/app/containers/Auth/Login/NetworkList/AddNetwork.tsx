/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { addNetwork } from 'modules/engine/actions';

import AddNetwork from 'components/Auth/Login/NetworkList/AddNetwork';

const mapStateToProps = (state: IRootState) => ({
    pending: state.engine.isConnecting
});

export default connect(mapStateToProps, {
    onSubmit: (params: { name: string, networkID?: number, apiHost: string }) => addNetwork.started(params)
})(AddNetwork);