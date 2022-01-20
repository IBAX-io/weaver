/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';

import Offline from 'components/Auth/Offline';

const mapStateToProps = (state: IRootState) => ({
    error: state.engine.networkError,
});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(Offline);