/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Redirect } from 'react-router';
import { routes } from 'lib/routing';

import themed from 'components/Theme/themed';

interface Props {
  app?: string;
  page?: string;
  action?: string;
}
/* const StyledLayout = themed.main`
    background: red;
    position: relative;
    padding-top: ${(props) => props.theme.menubarSize}px;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
`; */

const StyledLayout = themed.main`
    background: #fff;
    position: relative;
    padding-top: ${(props) => props.theme.menubarSize}px;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
`;

const Main: React.SFC<Props> = (props) => {
  const Route = routes[props.app];
  const headerProps =
    Route && Route.mapHeaderParams ? Route.mapHeaderParams(props) : props;
  const contentProps =
    Route && Route.mapContentParams ? Route.mapContentParams(props) : props;

  return (
    <StyledLayout>
      {Route ? (
        <>
          <Route.Header {...headerProps} />
          <Route.Content {...contentProps} />
        </>
      ) : (
        <Redirect to="/browse" />
      )}
    </StyledLayout>
  );
};

export default Main;
