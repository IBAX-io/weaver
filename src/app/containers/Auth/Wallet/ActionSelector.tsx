/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { navigate } from 'modules/engine/actions';

import ActionSelector from 'components/Auth/Wallet/ActionSelector';

export interface IActionSelectorContainerProps {

}

interface IActionSelectorContainerState {

}

interface IActionSelectorContainerDispatch {
    onImport: () => void;
    onCreate: () => void;
}

const mapStateToProps = (state: IRootState) => ({

});

const mapDispatchToProps = {
    onImport: () => navigate('/account/import'),
    onCreate: () => navigate('/account/create')
};

const ActionSelectorContainer: React.SFC<IActionSelectorContainerProps & IActionSelectorContainerState & IActionSelectorContainerDispatch> = props => (
    <ActionSelector {...props} />
);

export default connect<IActionSelectorContainerState, IActionSelectorContainerDispatch, IActionSelectorContainerProps>(mapStateToProps, mapDispatchToProps)(ActionSelectorContainer);