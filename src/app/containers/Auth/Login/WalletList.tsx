/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect, ResolveThunks } from 'react-redux';
import { IRootState } from 'modules';
import { login, selectWallet, removeWallet, loginGuest } from 'modules/auth/actions';
import { navigate } from 'modules/router/actions';
import { IAccount } from 'ibax/api';
import { cryptoSuiteKey, DEFAULT_CRYPTO_SUITE } from 'lib/crypto/suites';
import { walletAccount } from 'modules/auth/util/walletAccount';
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

// Stored wallets as accounts of the current network (its crypto suite decides the identity);
// details loaded from the node replace the placeholders once available
const selectWalletAccounts = (state: IRootState): IAccount[] => {
    const suite = state.engine.guestSession ? state.engine.guestSession.cryptoSuite : DEFAULT_CRYPTO_SUITE;
    return [...state.storage.wallets]
        .sort((a, b) => a.id > b.id ? 1 : -1)
        .filter(wallet => !!wallet.identities[cryptoSuiteKey(suite)])
        .map(wallet => (state.auth.wallets || []).find(l => l.walletID === wallet.id)
            || walletAccount(wallet, suite, { account: '', ecosystems: [] }));
};

const mapStateToProps = (state: IRootState) => ({
    isOffline: !state.engine.guestSession,
    pending: state.auth.isLoggingIn,
    wallets: selectWalletAccounts(state),
    notifications: state.socket.notifications,
    activationEmail: selectActivationMail(state),
    demoModeEnabled: selectDemoEnabled(state)
});

const mapDispatchToProps = {
    onRemove: removeWallet,
    onLogin: login.started,
    onSelect: selectWallet,
    onCopy: (wallet: IAccount) => modalShow({
        id: 'COPY_WALLET',
        type: 'COPY_WALLET',
        params: {
            wallet
        }
    }),
    onRegister: (wallet: IAccount, activationEmail: string) => modalShow({
        id: 'REGISTER_WALLET',
        type: 'REGISTER_WALLET',
        params: {
            wallet,
            activationEmail
        }
    }),
    onCreate: () => navigate({ to: '/account' }),
    onGuestLogin: () => loginGuest.started(undefined)
};

export default connect(mapStateToProps, mapDispatchToProps, (state, dispatch: ResolveThunks<typeof mapDispatchToProps>, props) => ({
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
    onRegister: (wallet: IAccount) => dispatch.onRegister(wallet, state.activationEmail),
    onCreate: dispatch.onCreate,
    onGuestLogin: dispatch.onGuestLogin

}))(WalletList);