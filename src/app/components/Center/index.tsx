/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';

export const StyledCenter = styled.div`
  display: table;
  width: 100%;
  height: 100%;
  padding: 0 0 0 0;
  box-sizing: border-box;
`;

export const StyledCenterContent = styled.div`
  display: table-cell;
  vertical-align: middle;
`;

const Center: React.SFC = (props) => (
  <StyledCenter>
    <StyledCenterContent>{props.children}</StyledCenterContent>
  </StyledCenter>
);

export default Center;
