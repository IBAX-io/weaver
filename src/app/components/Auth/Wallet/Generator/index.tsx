/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import { Col } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Validation from 'components/Validation';
import GeneratorTool from './GeneratorTool';

export interface IWalletGeneratorProps {
  descriptionValue: React.ReactNode;
  className?: string;
  seed: string;
  password: string;
  compareSeed?: string;
  comparePassword?: string;
  onSeedChange: (seed: string) => void;
  onPasswordChange: (password: string) => void;
  onGenerate?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  action: 'create' | 'import';
}

const Generator: React.FC<IWalletGeneratorProps> = (props) => (
  <div className={props.className}>
    <fieldset>
      <p className="text-center">{props.descriptionValue}</p>
    </fieldset>
    <fieldset>
      <Validation.components.ValidatedFormGroup for="seed" className="row">
        <Col md={3} className="clearfix">
          <div className="float-start">
            {props.action === 'import' ? (
              <FormattedMessage
                id="auth.backup"
                defaultMessage="Backup Payload (Private Key)"
              />
            ) : (
              <FormattedMessage id="auth.seed" defaultMessage="Auth seed" />
            )}
          </div>
          <div className="float-end d-md-none">
            <Validation.components.ValidationMessage for="seed" />
          </div>
        </Col>
        <Col md={9}>
          <div>
            <Validation.components.ValidatedTextarea
              className="input-seed"
              onChange={(e) => props.onSeedChange(e.target.value)}
              value={props.seed}
              name="seed"
              validators={
                props.compareSeed
                  ? [
                    Validation.validators.required,
                    Validation.validators.compare(props.compareSeed)
                  ]
                  : [Validation.validators.required, Validation.validators.mnemonic]
              }
            />
          </div>
          <div>
            {props.onGenerate && (
              <GeneratorTool onClick={props.onGenerate}>
                <FormattedMessage
                  id="auth.seed.generate"
                  defaultMessage="Generate"
                />
              </GeneratorTool>
            )}
            {props.onSave && (
              <GeneratorTool disabled={!props.seed} onClick={props.onSave}>
                <FormattedMessage id="auth.seed.save" defaultMessage="Save" />
              </GeneratorTool>
            )}
            {props.onLoad && (
              <GeneratorTool onClick={props.onLoad}>
                <FormattedMessage id="auth.seed.load" defaultMessage="Load" />
              </GeneratorTool>
            )}
          </div>
          <div className="d-none d-md-block text-start">
            <Validation.components.ValidationMessage for="seed" />
          </div>
        </Col>
      </Validation.components.ValidatedFormGroup>
    </fieldset>
    <fieldset>
      <Validation.components.ValidatedFormGroup for="password" className="row">
        <Col md={3} className="clearfix">
          <div className="float-start">
            <FormattedMessage id="general.password" defaultMessage="Password" />
          </div>
          <div className="float-end d-md-none">
            <Validation.components.ValidationMessage for="password" />
          </div>
        </Col>
        <Col md={9}>
          <Validation.components.ValidatedControl
            onChange={(e) => props.onPasswordChange(e.target.value)}
            value={props.password}
            name="password"
            type="password"
            validators={
              props.comparePassword
                ? [
                  Validation.validators.required,
                  Validation.validators.minlength(6),
                  Validation.validators.compare(props.comparePassword)
                ]
                : [
                  Validation.validators.required,
                  Validation.validators.minlength(6)
                ]
            }
          />
          <div className="d-none d-md-block text-start">
            <Validation.components.ValidationMessage for="password" />
          </div>

        </Col>
        <Col md={12}>
          <div className="d-none d-lg-block text-start">
            <FormattedMessage
              id="auth.backup.warn"
              defaultMessage="Backup Payload (Private Key)"
            />
          </div>
        </Col>
      </Validation.components.ValidatedFormGroup>
    </fieldset>
    <div />
  </div>
);

const StyledGenerator = styled(Generator)`
  textarea.input-seed {
    height: 60px;
    resize: none;
  }
`;

export default StyledGenerator;
