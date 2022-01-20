/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { DragDropContext } from 'react-dnd';
import { initialize } from 'modules/engine/actions';
import HTML5Backend from 'react-dnd-html5-backend';

import App from 'components/App';

const mapStateToProps = (state: IRootState) => ({
  //locale: state.engine.locale || 'en-US',
  locale: 'en-US',
  localeMessages: state.engine.localeMessages,
  isSessionAcquired: state.auth.isAcquired,
  isAuthenticated: state.auth.isAuthenticated,
  isLoaded: state.engine.isLoaded,
  isFatal: !!state.engine.fatalError,
  securityWarningClosed: state.storage.securityWarningClosed,
  network: state.engine.guestSession && state.engine.guestSession.network
});

const mapDispatchToProps = {
  initialize: initialize.started
};

export default DragDropContext(HTML5Backend)(
  connect(mapStateToProps, mapDispatchToProps, null, { pure: false })(App)
);
