/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { injectIntl, FormattedMessage, InjectedIntlProps } from 'react-intl';
import { readTextFile } from 'lib/fs';
import keyring from 'lib/keyring';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import Generator from './Generator';
import Validation from 'components/Validation';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';

export interface ICreateProps {
  onCreate: (params: { seed: string; password: string }) => void;
  onDownloadSeed: (seed: string) => void;
}

interface ICreateState {
  seed: string;
  seedConfirmation: string;
  isConfirming: boolean;
  password: string;
  passwordConfirm: string;
}

class Create extends React.Component<
  ICreateProps & InjectedIntlProps,
  ICreateState
> {
  private _inputFile: HTMLInputElement;

  constructor(props: ICreateProps & InjectedIntlProps) {
    super(props);
    this.state = {
      isConfirming: false,
      seed: '',
      seedConfirmation: '',
      password: '',
      passwordConfirm: ''
    };
  }

  onReturn = () => {
    this.setState({
      isConfirming: false
    });
  };

  onSubmit = (values: { [key: string]: any }) => {
    if (this.state.isConfirming) {
      this.props.onCreate({
        seed: this.state.seedConfirmation,
        password: this.state.passwordConfirm
      });
    } else {
      this.setState({
        isConfirming: true,
        password: values.password
      });
    }
  };

  onGenerate = () => {
    this.setState({
      seed: keyring.generateSeed()
    });
  };

  onSeedChange = (seed: string) => {
    this.setState({
      seed
    });
  };

  onSeedConfirmationChange = (seedConfirmation: string) => {
    this.setState({
      seedConfirmation
    });
  };

  onPasswordChange = (password: string) => {
    this.setState({
      password
    });
  };

  onPasswordConfirmationChange = (passwordConfirm: string) => {
    this.setState({
      passwordConfirm
    });
  };

  onSave = () => {
    this.props.onDownloadSeed(this.state.seed);
  };

  onLoad = () => {
    this._inputFile.click();
  };

  onLoadSuccess = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const content = await readTextFile(e.target.files[0]);
      this._inputFile.setAttribute('value', '');

      if (this.state.isConfirming) {
        this.onSeedConfirmationChange(content);
      } else {
        this.onSeedChange(content);
      }
    } catch (e) {
      // Fall back silently
    }
  };

  render() {
    return (
      <LocalizedDocumentTitle
        title="wallet.create"
        defaultTitle="Create wallet"
      >
        <div>
          <HeadingNetwork
            returnUrl={this.state.isConfirming ? null : '/account'}
            onReturn={this.state.isConfirming ? this.onReturn : null}
          >
            <FormattedMessage
              id="wallet.create"
              defaultMessage="Create account"
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
              {!this.state.isConfirming && (
                <Generator
                  seed={this.state.seed}
                  onGenerate={this.onGenerate}
                  onLoad={this.onLoad}
                  onSave={this.onSave}
                  onSeedChange={this.onSeedChange}
                  onPasswordChange={this.onPasswordChange}
                  password={this.state.password}
                  action="create"
                  descriptionValue={
                    <FormattedMessage
                      id="auth.remember.disclaimer"
                      defaultMessage="Please make sure that you keep your passphrase (account seed) safe and remember the password. You will be asked to retype them for confirmation"
                    />
                  }
                />
              )}
              {this.state.isConfirming && (
                <Generator
                  seed={this.state.seedConfirmation}
                  onLoad={this.onLoad}
                  onSeedChange={this.onSeedConfirmationChange}
                  onPasswordChange={this.onPasswordConfirmationChange}
                  password={this.state.passwordConfirm}
                  compareSeed={this.state.seed}
                  comparePassword={this.state.password}
                  action="create"
                  descriptionValue={
                    <FormattedMessage
                      id="auth.remember.disclaimer.confirm"
                      defaultMessage="Please repeat your registration values. This step is required to ensure that your passphrase and password are stored correctly"
                    />
                  }
                />
              )}
              <div className="text-right">
                <Validation.components.ValidatedSubmit bsStyle="primary">
                  {!this.state.isConfirming && (
                    <FormattedMessage
                      id="process.continue"
                      defaultMessage="Continue"
                    />
                  )}
                  {this.state.isConfirming && (
                    <FormattedMessage
                      id="process.confirm"
                      defaultMessage="Confirm"
                    />
                  )}
                </Validation.components.ValidatedSubmit>
              </div>
            </Validation.components.ValidatedForm>
          </div>
        </div>
      </LocalizedDocumentTitle>
    );
  }
}

export default injectIntl(Create);
