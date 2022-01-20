/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IRootState } from 'modules';
import { connect } from 'react-redux';
import { setLocale } from 'modules/engine/actions';

import LangMenu from 'components/Main/Header/LangMenu';

const mapStateToProps = (state: IRootState) => ({
    locale: state.engine.locale,
    locales: state.engine.locales
});

export default connect(mapStateToProps, {
    onChange: setLocale.started

})(LangMenu);