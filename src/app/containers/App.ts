/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { initialize } from 'modules/engine/actions';
import { selectScreen } from './appScreen';

import App from 'components/App';

const mapStateToProps = (state: IRootState) => ({
  locale: 'en-US',
  localeMessages: state.engine.localeMessages,
  screen: selectScreen(state),
  securityWarningClosed: state.storage.securityWarningClosed,
  network: state.engine.guestSession && state.engine.guestSession.network
});

const mapDispatchToProps = {
  initialize: () => initialize.started(undefined)
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
