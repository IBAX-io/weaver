/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { navigate } from 'modules/router/actions';
import pkcs11 from 'lib/pkcs11';

import ActionSelector from 'components/Auth/Wallet/ActionSelector';

export interface IActionSelectorContainerProps {

}

interface IActionSelectorContainerState {

}

interface IActionSelectorContainerDispatch {
    onImport: () => void;
    onCreate: () => void;
    onHardware: () => void;
}

const mapStateToProps = (state: IRootState) => ({

});

const mapDispatchToProps = {
    onImport: () => navigate({ to: '/account/import' }),
    onCreate: () => navigate({ to: '/account/create' }),
    onHardware: () => navigate({ to: '/account/hardware' })
};

const ActionSelectorContainer: React.FC<IActionSelectorContainerProps & IActionSelectorContainerState & IActionSelectorContainerDispatch> = ({ onHardware, ...props }) => (
    <ActionSelector {...props} onHardware={pkcs11 ? onHardware : undefined} />
);

export default connect<IActionSelectorContainerState, IActionSelectorContainerDispatch, IActionSelectorContainerProps>(mapStateToProps, mapDispatchToProps)(ActionSelectorContainer);