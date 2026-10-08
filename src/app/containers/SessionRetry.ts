/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { acquireSession, logout } from 'modules/auth/actions';
import { ISession } from 'ibax/auth';

import SessionRetry from 'components/SessionRetry';

const mapStateToProps = (state: IRootState) => ({
    reason: state.auth.sessionRetryReason,
    session: state.auth.session
});

const mapDispatchToProps = {
    acquire: (session: ISession) => acquireSession.started(session),
    signOut: () => logout.started(null)
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch) => ({
    reason: state.reason,
    onRetry: () => dispatch.acquire(state.session),
    onSignOut: dispatch.signOut
}))(SessionRetry);
