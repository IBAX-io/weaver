/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { ILocale } from 'ibax';

import HeaderButton from './HeaderButton';
import Heading from 'components/Dropdown/Heading';
import Item from 'components/Dropdown/Item';

interface Props {
  locale: string;
  locales: ILocale[];
  onChange?: (locale: string) => void;
}

const LangMenu: React.SFC<Props> = (props) => (
  <HeaderButton
    align="right"
    content={
      <div>
        <Heading>Language</Heading>
        <div>
          {props.locales.map((locale) => (
            <Item
              key={locale.key}
              disabled={locale.key === props.locale}
              onClick={() => props.onChange(locale.key)}
            >
              {locale.name}
            </Item>
          ))}
        </div>
      </div>
    }
  >
    <em className="icon icon-globe" />
  </HeaderButton>
);

export default LangMenu;
