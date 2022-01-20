/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { importWallet } from 'modules/auth/actions';

import Import from 'components/Auth/Wallet/Import';

const mapStateToProps = (_state: IRootState) => ({
});

const mapDispatchToProps = {
    onConfirm: importWallet.started
};

export default connect(mapStateToProps, mapDispatchToProps)(Import);