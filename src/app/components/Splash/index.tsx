/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';

export default class extends React.Component {
  render() {
    return (
      <div className="preloader">
        <div className="content">
          <div className="loader">
            Weaver
          </div>
          <div className="version">{__APP_VERSION__}</div>
        </div>
      </div>
    );
  }
}
