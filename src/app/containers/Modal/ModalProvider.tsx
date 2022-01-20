/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { IModal } from 'ibax/modal';
import { modalClose } from 'modules/modal/actions';
import { enqueueNotification } from 'modules/notifications/actions';

import ModalProvider from 'components/Modal/ModalProvider';
import { InjectedIntlProps, injectIntl } from 'react-intl';

interface IModalProviderContainerProps {}

interface IModalProviderContainerState {
  modal: IModal;
}

interface IModalProviderContainerDispatch {
  modalClose: typeof modalClose;
  enqueueNotification: typeof enqueueNotification;
}

class ModalProviderContainer extends React.Component<
  IModalProviderContainerProps &
    IModalProviderContainerState &
    IModalProviderContainerDispatch &
    InjectedIntlProps
> {
  render() {
    return (
      <ModalProvider
        modal={this.props.modal}
        onResult={this.props.modalClose}
        enqueueNotification={this.props.enqueueNotification}
        intl={this.props.intl}
      >
        {this.props.children}
      </ModalProvider>
    );
  }
}

const mapStateToProps = (state: IRootState) => ({
  modal: state.modal
});

const mapDispatchToProps = {
  modalClose: modalClose,
  enqueueNotification: enqueueNotification
};

export default connect<
  IModalProviderContainerState,
  IModalProviderContainerDispatch,
  IModalProviderContainerProps
>(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(ModalProviderContainer));
