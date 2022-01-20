/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { ISection } from 'ibax/content';

import themed from 'components/Theme/themed';
import Sections from 'containers/Main/Navigator/Sections';
import Breadcrumbs from './Sections/Breadcrumbs';
import NotFound from './Page/NotFound';

const StyledWrapper = themed.div`
    background-color: #f6f8fa;
    position: relative;
`;

interface Props {
  section: string;
  sections: { [key: string]: ISection };
  page: string;
  stylesheet: string;
  onRefresh?: () => void;
}

const StyledContent = themed.section`
    margin-left: 0 !important;
    && { background: ${(props) => props.theme.contentBackground}; }
    color: ${(props) => props.theme.contentForeground};
    transition: none !important;
    overflow: hidden;
`;

const Navigator: React.SFC<Props> = (props) => {
  const section = props.sections[props.section];

  return (
    <StyledWrapper className="wrapper">
      <style type="text/css">{props.stylesheet}</style>
      <StyledContent>
        {section ? (
          <>
            <Breadcrumbs
              values={section.breadcrumbs}
              onRefresh={props.onRefresh}
            />
            <Sections
              section={props.section}
              values={props.sections}
              page={props.page}
            />
          </>
        ) : (
          <NotFound />
        )}
      </StyledContent>
    </StyledWrapper>
  );
};

export default Navigator;
