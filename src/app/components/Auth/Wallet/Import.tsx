/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { injectIntl, FormattedMessage, InjectedIntlProps } from 'react-intl';
import { readTextFile } from 'lib/fs';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import Generator from './Generator';
import Validation from 'components/Validation';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';

export interface IImportProps {
  onConfirm: (params: { backup: string; password: string }) => void;
}

interface IImportState {
  backup: string;
  password: string;
}

class Import extends React.Component<
  IImportProps & InjectedIntlProps,
  IImportState
> {
  private _inputFile: HTMLInputElement;

  constructor(props: IImportProps & InjectedIntlProps) {
    super(props);
    this.state = {
      backup: '',
      password: ''
    };
  }

  onSubmit = () => {
    this.props.onConfirm({
      backup: this.state.backup,
      password: this.state.password
    });
  };

  onBackupChange = (backup: string) => {
    this.setState({
      backup
    });
  };

  onPasswordChange = (password: string) => {
    this.setState({
      password
    });
  };

  onLoad = () => {
    this._inputFile.click();
  };

  onLoadSuccess = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const backup = await readTextFile(e.target.files[0]);
      this._inputFile.setAttribute('value', '');

      this.setState({
        backup
      });
    } catch (e) {
      // Fall back silently
    }
  };

  render() {
    return (
      <LocalizedDocumentTitle
        title="wallet.import"
        defaultTitle="Import wallet"
      >
        <div>
          <HeadingNetwork returnUrl="/account">
            <FormattedMessage
              id="wallet.import"
              defaultMessage="Import account"
            />
          </HeadingNetwork>
          <input
            type="file"
            className="hidden"
            onChange={this.onLoadSuccess}
            ref={(l) => (this._inputFile = l)}
          />
          <div className="text-center">
            <Validation.components.ValidatedForm
              onSubmitSuccess={this.onSubmit}
            >
              <Generator
                seed={this.state.backup}
                onLoad={this.onLoad}
                onSeedChange={this.onBackupChange}
                onPasswordChange={this.onPasswordChange}
                password={this.state.password}
                action="import"
                descriptionValue={
                  <FormattedMessage
                    id="auth.import.disclaimer"
                    defaultMessage="Please enter your account backup payload to restore access to the system"
                  />
                }
              />
              <div className="text-right">
                <Validation.components.ValidatedSubmit bsStyle="primary">
                  <FormattedMessage
                    id="process.confirm1"
                    defaultMessage="Confirm"
                  />
                </Validation.components.ValidatedSubmit>
              </div>
            </Validation.components.ValidatedForm>
          </div>
        </div>
      </LocalizedDocumentTitle>
    );
  }
}

export default injectIntl(Import);
