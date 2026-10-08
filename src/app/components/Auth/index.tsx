/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Route, Routes } from 'react-router';
import { FormattedMessage, useIntl } from 'react-intl';
import LangMenu from 'containers/Main/Header/LangMenu';
import themed from 'components/Theme/themed';
import Wallet from 'components/Auth/Wallet';
import Copyright from './Copyright';
import Login from 'containers/Auth/Login';
import NetworkList from 'containers/Auth/Login/NetworkList';
import AddNetwork from 'containers/Auth/Login/NetworkList/AddNetwork';

export interface IAuthProps {
  className?: string;
}

const Auth: React.FC<IAuthProps> = (props) => {
  const intl = useIntl();
  return (
    <div className={props.className}>
      <div className="auth-window-container">
        <div className="auth-window">
          <div className="card m0">
            <div className="card-body">
              <Routes>
                <Route path="/account/*" element={<Wallet />} />
                <Route path="/networks/add/*" element={<AddNetwork />} />
                <Route path="/networks/*" element={<NetworkList />} />
                <Route path="*" element={<Login />} />
              </Routes>
            </div>
          </div>
          <div className="clearfix p-lg text-center text-white">
            <div className="float-start">
              <div>
                <Copyright />
                &nbsp;
                <a
                  className="year-title"
                  style={{ color: '#fff' }}
                  href={intl.formatMessage({
                    id: 'legal.homepage',
                    defaultMessage: 'https://ibax.io'
                  })}
                >
                  <FormattedMessage
                    id="legal.homepage"
                    defaultMessage="https://ibax.io"
                  />
                </a>
              </div>
            </div>
            <div className="float-end">
              <LangMenu />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default themed(Auth)`
    display: table; 
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow: hidden;

    .auth-window-container {
        display: table-cell;
        vertical-align: middle;
        overflow: hidden;
        height: 100%;

        .auth-window {
            text-align: center;
            max-width: 600px;
            height: auto;
            padding: 10px;
            padding-top: 0;
            margin: 0 auto;
            
            .card {
                height: auto;
                overflow: hidden;
                background: #fff;
                border: 0;

                > .card-body {
                    padding: 15px;
                    overflow-x: hidden;
                    overflow-y: auto;
                    max-height: 100%;
                    height: 100%;
                }
            }
        }
    }
`;
