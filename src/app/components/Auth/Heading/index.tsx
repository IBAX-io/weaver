/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';

import themed from 'components/Theme/themed';
import BackButton from './BackButton';

export interface IHeadingOption {
  icon: string;
  title: string;
  navigateUrl: string;
}

export interface IHeadingProps {
  className?: string;
  returnUrl?: string;
  onReturn?: () => void;
  option: React.ReactNode;
}

const Heading: React.SFC<IHeadingProps> = (props) => (
  <div className={props.className}>
    <div className="heading-content">
      <div className="heading-left">
        {(props.returnUrl || props.onReturn) && (
          <BackButton returnUrl={props.returnUrl} onClick={props.onReturn} />
        )}
      </div>
      <div className="heading-title">{props.children}</div>
      {props.option && <div className="heading-right">{props.option}</div>}
    </div>
  </div>
);

export default themed(Heading)`
    background: ${(props) => props.theme.headerBackground};
    margin: -15px -15px 15px;
    padding: 0 15px;
    height: 45px;
    line-height: 43px;

    .heading-content {
        position: relative;

        .heading-left {
            position: absolute;
            top: 2px;
            left: 0;
            bottom: 0;
        }

        .heading-right {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
        }

        .heading-title {
            color: ${(props) => props.theme.headerForeground};
            font-size: 18px;
        }
    }
`;
