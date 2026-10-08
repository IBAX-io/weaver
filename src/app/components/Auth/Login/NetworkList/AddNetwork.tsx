/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { Col } from 'react-bootstrap';

import LocalizedDocumentTitle from 'components/DocumentTitle/LocalizedDocumentTitle';
import HeadingNetwork from 'containers/Auth/HeadingNetwork';
import Validation from 'components/Validation';

export interface IAddNetworkProps {
  pending: boolean;
  onSubmit?: (params: {
    name: string;
    networkID?: number;
    apiHost: string;
    explorer?: string;
  }) => void;
}

interface IAddNetworkState {
  name: string;
  autoDiscovery: boolean;
  networkID: number;
  apiHost: string;
  explorer: string;
}

class AddNetwork extends React.Component<IAddNetworkProps, IAddNetworkState> {
  state: IAddNetworkState = {
    name: '',
    autoDiscovery: false,
    networkID: 1,
    apiHost: '',
    explorer: ''
  };

  onNameChange = (name: string) => {
    this.setState({
      name
    });
  };

  onDiscoveryChange = (autoDiscovery: boolean) => {
    this.setState({
      autoDiscovery
    });
  };

  onNetworkIDChange = (networkID: number) => {
    this.setState({
      networkID
    });
  };

  onApiHostChange = (apiHost: string) => {
    this.setState({
      apiHost
    });
  };

  onSubmit = (payload: any) => {
    this.props.onSubmit({
      name: payload.name,
      networkID: payload.discovery ? undefined : parseInt(payload.id, 10),
      apiHost: payload.url,
      explorer: (payload.explorer || '').trim() || undefined
    });
  };

  render() {
    return (
      <LocalizedDocumentTitle title="auth.login" defaultTitle="Login">
        <div className={classNames('desktop-flex-col desktop-flex-stretch')}>
          <HeadingNetwork returnUrl="/networks">
            <FormattedMessage
              id="general.network.add"
              defaultMessage="Add network"
            />
          </HeadingNetwork>
          <Validation.components.ValidatedForm onSubmitSuccess={this.onSubmit}>
            <fieldset>
              <p className="text-center">
                <FormattedMessage
                  id="general.network.add.help"
                  defaultMessage="Enter network parameters. If connection succeeds it will be added to the list of configured networks"
                />
              </p>
            </fieldset>
            <fieldset>
              <Validation.components.ValidatedFormGroup for="name" className="row">
                <Col md={3} className="clearfix">
                  <div className="float-start">
                    <FormattedMessage
                      id="general.network.name"
                      defaultMessage="Name"
                    />
                  </div>
                  <div className="float-end d-md-none">
                    <Validation.components.ValidationMessage for="name" />
                  </div>
                </Col>
                <Col md={9}>
                  <div>
                    <Validation.components.ValidatedControl
                      onChange={(e) =>
                        this.onNameChange((e.target as HTMLInputElement).value)
                      }
                      value={this.state.name}
                      name="name"
                      validators={[Validation.validators.required]}
                    />
                  </div>
                </Col>
              </Validation.components.ValidatedFormGroup>
            </fieldset>
            <fieldset>
              <Validation.components.ValidatedFormGroup for="id" className="row">
                <Col md={3} className="clearfix">
                  <div className="float-start">
                    <FormattedMessage
                      id="general.network.id.short"
                      defaultMessage="ID"
                    />
                  </div>
                  <div className="float-end d-md-none">
                    <Validation.components.ValidationMessage for="id" />
                  </div>
                </Col>
                <Col md={9}>
                  <div className="text-start">
                    <Validation.components.ValidatedControl
                      onChange={(e) =>
                        this.onNetworkIDChange(
                          (e.target as HTMLInputElement).valueAsNumber
                        )
                      }
                      value={String(this.state.networkID)}
                      type="number"
                      name="id"
                      key={String(this.state.autoDiscovery)}
                      disabled={this.state.autoDiscovery}
                      validators={
                        this.state.autoDiscovery
                          ? []
                          : [Validation.validators.required]
                      }
                    />
                    <Validation.components.ValidatedCheckbox
                      onChange={(e) =>
                        this.onDiscoveryChange(
                          (e.target as HTMLInputElement).checked
                        )
                      }
                      checked={this.state.autoDiscovery}
                      name="discovery"
                      title={
                        <FormattedMessage
                          id="general.network.id.auto"
                          defaultMessage="Automatic discovery"
                        />
                      }
                    />
                  </div>
                </Col>
              </Validation.components.ValidatedFormGroup>
            </fieldset>
            <fieldset>
              <Validation.components.ValidatedFormGroup for="url" className="row">
                <Col md={3} className="clearfix">
                  <div className="float-start">
                    <FormattedMessage
                      id="general.network.url"
                      defaultMessage="Node URL"
                    />
                  </div>
                  <div className="float-end d-md-none">
                    <Validation.components.ValidationMessage for="url" />
                  </div>
                </Col>
                {/* node IP */}
                <Col md={9}>
                  <div className="text-start">
                    <Validation.components.ValidatedControl
                      onChange={(e) =>
                        this.onApiHostChange(
                          (e.target as HTMLInputElement).value
                        )
                      }
                      value={this.state.apiHost}
                      name="url"
                      validators={[Validation.validators.required]}
                    />
                  </div>
                </Col>
              </Validation.components.ValidatedFormGroup>
            </fieldset>

            <fieldset>
              <Validation.components.ValidatedFormGroup for="explorer" className="row">
                <Col md={3} className="clearfix">
                  <div className="float-start">
                    <FormattedMessage id="general.network.explorer" defaultMessage="Block explorer API (optional)" />
                  </div>
                  <div className="float-end d-md-none">
                    <Validation.components.ValidationMessage for="explorer" />
                  </div>
                </Col>
                <Col md={9}>
                  <div className="text-start">
                    <Validation.components.ValidatedControl
                      onChange={(e) => this.setState({ explorer: (e.target as HTMLInputElement).value })}
                      value={this.state.explorer}
                      name="explorer"
                      placeholder="https://"
                      validators={[Validation.validators.httpsUrl]}
                    />
                    <div className="small text-start">
                      <FormattedMessage
                        id="general.network.explorer.desc"
                        defaultMessage="Where the wallet looks up the account's UTXO transfers, such as https://scan.ibax.network:8800/api/v2. Without one, they cannot be listed."
                      />
                    </div>
                  </div>
                </Col>
              </Validation.components.ValidatedFormGroup>
            </fieldset>

            <div className="text-end">
              <Validation.components.ValidatedSubmit
                variant="primary"
                disabled={this.props.pending}
              >
                <FormattedMessage
                  id="process.continue"
                  defaultMessage="Continue"
                />
              </Validation.components.ValidatedSubmit>
            </div>
          </Validation.components.ValidatedForm>
        </div>
      </LocalizedDocumentTitle>
    );
  }
}

export default AddNetwork;
