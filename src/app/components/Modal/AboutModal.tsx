/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { Button } from 'react-bootstrap';
import imgLogo from 'images/logo.png';
import { FormattedMessage } from 'react-intl';

import Modal from './';
import desktop from 'lib/desktop';

class AboutModal extends Modal<void, void> {
  openWebsite = () => {
    const url = this.props.intl.formatMessage({
      id: 'legal.homepage',
      defaultMessage: 'https://ibax.io'
    });
    if (desktop) {
      desktop.openExternal(url);
    }
    else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  render() {
    return (
      <div>
        <Modal.Header>
          <FormattedMessage id="general.about" defaultMessage="About" />
        </Modal.Header>
        <Modal.Body>
          <div
            className="text-center"
            style={{ padding: '10px 20px', maxWidth: 350 }}
          >
            <img src={imgLogo} style={{ height: 50 }} />
            <div className="text-muted">
              {__APP_VERSION__
                ? `v${__APP_VERSION__}`
                : 'DEVELOPER BUILD'}
            </div>
            <div>
              <FormattedMessage
                id="legal.about"
                defaultMessage="Molis - a software product developed by Ibax. It works with blockchain networks that are built to use Ibax Protocol"
              />
            </div>
            <Button variant="link" onClick={this.openWebsite}>
              <FormattedMessage
                id="legal.homepage"
                defaultMessage="https://ibax.io"
              />
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="text-end">
          <Button
            type="button"
            variant="primary"
            onClick={this.props.onCancel.bind(this)}
          >
            <FormattedMessage id="close" defaultMessage="Close" />
          </Button>
        </Modal.Footer>
      </div>
    );
  }
}
export default AboutModal;
