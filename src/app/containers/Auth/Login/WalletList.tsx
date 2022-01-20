/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { login, selectWallet, removeWallet, loginGuest } from 'modules/auth/actions';
import { navigate } from 'modules/engine/actions';
import { IWallet } from 'ibax/auth';
import { modalShow } from 'modules/modal/actions';

import WalletList from 'components/Auth/Login/WalletList';

const selectNetwork = (state: IRootState) => {
    const session = state.engine.guestSession;
    if (!session) {
        return undefined;
    }

    return state.storage.networks.find(l => l.uuid === session.network.uuid);
};

const selectActivationMail = (state: IRootState) => {
    const network = selectNetwork(state);
    return network ? network.activationEmail : '';
};

const selectDemoEnabled = (state: IRootState) => {
    const network = selectNetwork(state);
    return network ? network.demoEnabled : false;
};

const mapStateToProps = (state: IRootState) => ({
    isOffline: !state.engine.guestSession,
    pending: state.auth.isLoggingIn,
    wallets: state.storage.wallets.sort((a, b) => a.id > b.id ? 1 : -1).map(wallet => ({
        access: [],
        encKey: wallet.encKey,
        publicKey: wallet.publicKey,
        id: wallet.id,
        ...(state.auth.wallets || []).find(l => l.id === wallet.id)
    })),
    notifications: state.socket.notifications,
    activationEmail: selectActivationMail(state),
    demoModeEnabled: selectDemoEnabled(state)
});

const mapDispatchToProps = {
    onRemove: removeWallet,
    onLogin: login.started,
    onSelect: selectWallet,
    onCopy: (wallet: IWallet) => modalShow({
        id: 'COPY_WALLET',
        type: 'COPY_WALLET',
        params: {
            wallet
        }
    }),
    onRegister: (wallet: IWallet, activationEmail: string) => modalShow({
        id: 'REGISTER_WALLET',
        type: 'REGISTER_WALLET',
        params: {
            wallet,
            activationEmail
        }
    }),
    onCreate: () => navigate('/account'),
    onGuestLogin: () => loginGuest.started(undefined)
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch: any, props) => ({
    ...props,
    isOffline: state.isOffline,
    pending: state.pending,
    wallets: state.wallets,
    notifications: state.notifications,
    activationEnabled: !!state.activationEmail,
    demoModeEnabled: state.demoModeEnabled,
    onRemove: dispatch.onRemove,
    onLogin: dispatch.onLogin,
    onSelect: dispatch.onSelect,
    onCopy: dispatch.onCopy,
    onRegister: (wallet: IWallet) => dispatch.onRegister(wallet, state.activationEmail),
    onCreate: dispatch.onCreate,
    onGuestLogin: dispatch.onGuestLogin

}))(WalletList);