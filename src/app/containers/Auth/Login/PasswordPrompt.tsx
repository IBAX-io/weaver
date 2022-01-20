/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { ILoginCall } from 'ibax/auth';
import { logout, login } from 'modules/auth/actions';

import PasswordPrompt from 'components/Auth/Login/PasswordPrompt';

const mapStateToProps = (state: IRootState) => ({
    wallet: state.auth.wallet
});

const mapDispatchToProps = {
    onCancel: () => logout.started(null),
    onSubmit: (params: ILoginCall) => login.started(params)
};

export default connect(mapStateToProps, mapDispatchToProps)(PasswordPrompt);