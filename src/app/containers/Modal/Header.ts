/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { modalClose } from 'modules/modal/actions';

import Header from 'components/Modal/Header';

const mapStateToProps = (state: IRootState) => ({
    modalID: state.modal.id
});

const mapDispatchToProps = {
    modalClose
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch, props: React.PropsWithChildren<{}>) => ({
    ...props,
    onClose: () => dispatch.modalClose({
        id: state.modalID,
        reason: 'CANCEL',
        data: null
    })
}))(Header);