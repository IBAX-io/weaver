/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import themed from 'components/Theme/themed';

import SectionButton from './SectionButton';

export interface ISelectorProps {
  section: string;
  values: {
    index: number;
    title: string;
    name: string;
    page: string;
    params: {
      [name: string]: string;
    };
  }[];
}

const StyledSelector = themed.ul`
    margin: 0;
    padding: 0;
    height: 100%;

    > li {
        list-style-type: none;
        height: 100%;
        display: inline-flex;
        padding 0 10px;
        align-items: center;
        &:first-child {
            padding-left: 0;
        }

        &:last-child {
            padding-right: 0;
        }
    }
`;

const Selector: React.SFC<ISelectorProps> = (props) => (
  <StyledSelector>
    {props.values.map((section) => (
      <li key={section.name}>
        <SectionButton
          active={props.section === section.name}
          section={section.name}
          page={section.page}
          params={section.params}
        >
          {section.title}
        </SectionButton>
      </li>
    ))}
  </StyledSelector>
);

export default Selector;
