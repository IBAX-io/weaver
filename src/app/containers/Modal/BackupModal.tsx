/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { IModalProps } from 'components/Modal';
import { FormattedMessage } from 'react-intl';
import { modalShow } from 'modules/modal/actions';

import BackupModal from 'components/Modal/BackupModal';

const mapStateToProps = (state: IRootState) => ({
    privateKey: state.auth.privateKey,
    publicKey: state.auth.wallet.wallet.publicKey,
    address: state.auth.wallet.wallet.address
});

export default connect(mapStateToProps, {
    modalShow

}, (state, dispatch: any, props: IModalProps<any, any>) => ({
    ...props,
    params: {
        ...state,
        onCopy: () => dispatch.modalShow({
            id: 'I_COPIED',
            type: 'INFO',
            params: {
                value: (<FormattedMessage id="alert.clipboard.copied" defaultMessage="alert.clipboard.copied" />)
            }
        })
    },
}))(BackupModal);