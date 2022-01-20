/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { logout } from 'modules/auth/actions';

import Login from 'components/Auth/Login';

const mapStateToProps = (state: IRootState) => ({
    wallet: state.auth.wallet,
    isAuthenticating: !!state.engine.guestSession && state.auth.wallet && !state.auth.isAuthenticated
});

const mapDispatchToProps = {
    onLogout: logout.started
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);