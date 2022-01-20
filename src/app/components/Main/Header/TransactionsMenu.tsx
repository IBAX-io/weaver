/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import DropdownButton from 'components/Button/DropdownButton';

interface Props {}

const TransactionsMenu: React.SFC<Props> = (props) => (
  <DropdownButton
    align="right"
    menuWidth={300}
    content={
      <div style={{ color: '#000' }}>
        <div>Content goes here</div>
        <div>Content goes here</div>
        <div>Content goes here</div>
        <div>Content goes here</div>
        <div>Content goes here</div>
      </div>}
  >
    <em className="icon icon-hourglass" />
  </DropdownButton>
);

export default TransactionsMenu;
