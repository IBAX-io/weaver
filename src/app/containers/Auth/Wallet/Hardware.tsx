/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { Navigate } from 'react-router';
import { addModuleWallet } from 'modules/auth/actions';
import pkcs11 from 'lib/pkcs11';

import Hardware from 'components/Auth/Wallet/Hardware';

interface IHardwareContainerProps {
    onAdd: typeof addModuleWallet.started;
}

// Desktop app only: the browser cannot reach a PKCS#11 module
const HardwareContainer: React.FC<IHardwareContainerProps> = props => pkcs11
    ? <Hardware pkcs11={pkcs11} onAdd={props.onAdd} />
    : <Navigate to="/account" replace />;

export default connect(null, { onAdd: addModuleWallet.started })(HardwareContainer);
