/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { modalShow } from 'modules/modal/actions';

import Auth from 'components/Auth';

const mapStateToProps = (state: IRootState) => ({
});

const mapDispatchToProps = {
    changeLocale: () => modalShow({
        id: 'CHANGE_LOCALE',
        type: 'CHANGE_LOCALE',
        params: {}
    })
};

export default connect(mapStateToProps, mapDispatchToProps)(Auth);