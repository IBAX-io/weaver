/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import SecurityWarning from 'components/SecurityWarning';
import { closeSecurityWarning } from 'modules/storage/actions';

const mapDispatchToProps = {
    close: () => closeSecurityWarning(undefined)
};

const connector = connect(null, mapDispatchToProps);

type Props = React.PropsWithChildren<ConnectedProps<typeof connector>>;

const SecurityWarningContainer: React.FC<Props> = props => (
    <SecurityWarning close={props.close}>
        {props.children}
    </SecurityWarning>
);

export default connector(SecurityWarningContainer);
