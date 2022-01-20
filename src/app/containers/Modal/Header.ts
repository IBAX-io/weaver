/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { modalClose } from 'modules/modal/actions';

import Header from 'components/Modal/Header';

const mapStateToProps = (state: IRootState) => ({

});

const mapDispatchToProps = {
    onClose: () => modalClose({
        reason: 'CANCEL',
        data: null
    })
};

export default connect<{}, { onClose: () => void }, {}>(mapStateToProps, mapDispatchToProps)(Header);