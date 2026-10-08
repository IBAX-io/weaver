/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Navigate } from 'react-router';
import { routes } from 'lib/routing/routes';

import themed from 'components/Theme/themed';

interface Props {
  app?: string;
  page?: string;
  action?: string;
}
const StyledLayout = themed.main`
    background: #fff;
    position: relative;
    padding-top: ${(props) => props.theme.menubarSize}px;
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
`;

const Main: React.FC<Props> = (props) => {
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
        <Navigate to="/browse" replace />
      )}
    </StyledLayout>
  );
};

export default Main;
