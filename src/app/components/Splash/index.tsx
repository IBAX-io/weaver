/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
/* import imgLogo from 'images/logo.svg';
 */
export default class extends React.Component {
  render() {
    return (
      <div className="preloader">
        <div className="content">
          <div className="loader">
            IBAX
          </div>
          <div className="version">{process.env.REACT_APP_VERSION}</div>
        </div>
      </div>
    );
  }
}
