/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { INetworkEndpoint } from 'ibax/auth';
import { Route, Routes, useParams } from 'react-router';
import { FormattedMessage, IntlProvider } from 'react-intl';
import { DndProvider } from '@nosferatu500/react-dnd';
import { HTML5Backend } from '@nosferatu500/react-dnd-html5-backend';
import { mainRoute } from 'lib/routing/routes';
import platform from 'lib/platform';
import classnames from 'classnames';
import baseTheme from 'components/Theme/baseTheme';

import themed from 'components/Theme/themed';
import Auth from 'components/Auth';
import Error from 'containers/Auth/Error';
import Splash from 'components/Splash';
import ModalProvider from 'containers/Modal/ModalProvider';
import NotificationsProvider from 'containers/Notifications/NotificationsProvider';
import SecurityWarning from 'containers/SecurityWarning';
import ThemeProvider from 'components/Theme/ThemeProvider';
import Titlebar from 'components/Titlebar';
import Main from './Main';

interface AppProps {
  network: INetworkEndpoint;
  locale: string;
  isSessionAcquired: boolean;
  isAuthenticated: boolean;
  isLoaded: boolean;
  isFatal: boolean;
  securityWarningClosed: boolean;
  localeMessages: { [key: string]: string };
  initialize: () => void;
}

const ThemedApp = themed.div`
    &.platform-windows {
        border: solid 1px ${(props) => props.theme.windowBorder};
    }
`;

const FadeIn = themed.div`
    animation: app-fade-in .3s ease-out;
    @keyframes app-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const MainRoute: React.FC = () => <Main {...useParams()} />;

const StyledTitlebar = themed.div`
    background: ${(props) => props.theme.headerBackground};
    height: ${(props) => props.theme.headerHeight}px;
    line-height: ${(props) => props.theme.headerHeight}px;
    font-size: 15px;
    color: #fff;
    text-align: center;
`;

class App extends React.Component<AppProps> {
  componentDidMount() {
    this.props.initialize();
  }

  // The first condition that holds decides the screen, in this order
  screen() {
    if (this.props.isFatal) {
      return 'error';
    }
    if (!this.props.isLoaded) {
      return 'splash';
    }
    if (!this.props.isAuthenticated) {
      return 'auth';
    }
    if (!this.props.isSessionAcquired) {
      return 'splash';
    }
    return 'main';
  }

  renderScreen() {
    switch (this.screen()) {
      case 'error': return <Error />;
      case 'splash': return <Splash />;
      case 'auth': return <Auth />;
      default: return (
        <Routes>
          <Route path={mainRoute} element={<MainRoute />} />
        </Routes>
      );
    }
  }

  render() {
    const appTitle = `Weaver ${this.props.network ? '(' + this.props.network.apiHost + ')' : ''
      }`;
    const classes = classnames({
      wrapper: true,
      'layout-fixed': true,
      'platform-desktop': platform.select({ desktop: true }),
      'platform-web': platform.select({ web: true }),
      'platform-windows': platform.select({ win32: true })
    });

    return (
      <DndProvider backend={HTML5Backend}>
      <IntlProvider
        key={this.props.locale}
        locale={this.props.locale}
        defaultLocale="en-US"
        messages={this.props.localeMessages}
        textComponent="span"
      >
        <ThemeProvider theme={baseTheme}>
          <ThemedApp className={classes}>
            <StyledTitlebar className="drag">
              <Titlebar>{appTitle}</Titlebar>
            </StyledTitlebar>

            <ModalProvider />
            <NotificationsProvider />

            {platform.select({
              web: !this.props.securityWarningClosed && (
                <SecurityWarning>
                  <FormattedMessage
                    id="general.security.warning"
                    defaultMessage="Please use desktop version or mobile application for better security"
                  />
                </SecurityWarning>
              )
            })}

            <FadeIn key={this.screen()}>{this.renderScreen()}</FadeIn>
          </ThemedApp>
        </ThemeProvider>
      </IntlProvider>
      </DndProvider>
    );
  }
}

export default App;
