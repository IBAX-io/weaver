/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router';
import store from 'store';
import platform from 'lib/platform';
import { attachRouter } from 'lib/routing/navigation';
import 'font-awesome/css/font-awesome.css';
import 'simple-line-icons/css/simple-line-icons.css';
import 'styles/scss/sass.scss';
import 'styles/index.css';
import App from 'containers/App';

// One catch-all route renders the app; screens declare their own <Routes> below it
const routes = [{ path: '*', element: <App /> }];

const router = platform.select({
  web: () => createBrowserRouter(routes),
  desktop: () => createMemoryRouter(routes)
})();

attachRouter(router, store.dispatch);

createRoot(document.querySelector('#root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
