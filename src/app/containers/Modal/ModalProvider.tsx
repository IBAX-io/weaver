/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useIntl } from 'react-intl';
import { IRootState } from 'modules';
import { modalClose } from 'modules/modal/actions';
import { enqueueNotification } from 'modules/notifications/actions';

import ModalProvider from 'components/Modal/ModalProvider';

const mapStateToProps = (state: IRootState) => ({
    modal: state.modal
});

const mapDispatchToProps = {
    modalClose,
    enqueueNotification
};

const connector = connect(mapStateToProps, mapDispatchToProps);

const ModalProviderContainer: React.FC<ConnectedProps<typeof connector>> = props => {
    const intl = useIntl();

    return (
        <ModalProvider
            modal={props.modal}
            onResult={props.modalClose}
            enqueueNotification={props.enqueueNotification}
            intl={intl}
        />
    );
};

export default connector(ModalProviderContainer);
