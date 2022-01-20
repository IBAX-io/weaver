/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';

import Error from 'components/Auth/Error';

const mapStateToProps = (state: IRootState) => ({
    type: state.engine.fatalError && state.engine.fatalError.name,
    message: state.engine.fatalError && state.engine.fatalError.message
});

export default connect(mapStateToProps, {})(Error);