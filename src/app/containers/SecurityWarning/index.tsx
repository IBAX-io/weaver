/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import SecurityWarning from 'components/SecurityWarning';
import { closeSecurityWarning } from 'modules/storage/actions';

export interface ISecurityWarningContainerProps {
    closed?: boolean;
}

interface ISecurityWarningContainerState {
}

interface ISecurityWarningContainerDispatch {
    close: () => void;
}

const SecurityWarningContainer: React.SFC<ISecurityWarningContainerProps & ISecurityWarningContainerState & ISecurityWarningContainerDispatch> = props => (
    <SecurityWarning {...props} />
);

const mapStateToProps = (state: IRootState) => ({
    closed: state.storage.securityWarningClosed
});

const mapDispatchToProps = {
    close: closeSecurityWarning
};

export default connect<ISecurityWarningContainerState, ISecurityWarningContainerDispatch, ISecurityWarningContainerProps>(mapStateToProps, mapDispatchToProps)(SecurityWarningContainer);