/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect, ResolveThunks } from 'react-redux';
import { IRootState } from 'modules';
import { login, selectWallet, removeWallet, loginGuest, upgradeLegacyWallet } from 'modules/auth/actions';
import { isLegacyWallet } from 'lib/crypto/legacyWallet';
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

// The last result for the same inputs (compared by reference), so the list re-renders only when
// they change, not on every store update
const memoized = <A extends unknown[], R>(compute: (...inputs: A) => R) => {
    let last: { inputs: A; result: R } | null = null;
    return (...inputs: A) => {
        if (!last || inputs.length !== last.inputs.length || inputs.some((input, i) => input !== last.inputs[i])) {
            last = { inputs, result: compute(...inputs) };
        }
        return last.result;
    };
};

// Stored wallets as accounts of the current network (its crypto suite decides the identity);
// details loaded from the node replace the placeholders once available
const walletAccounts = memoized((wallets: IRootState['storage']['wallets'], accounts: IAccount[], suite: typeof DEFAULT_CRYPTO_SUITE): IAccount[] =>
    [...wallets]
        .sort((a, b) => a.id > b.id ? 1 : -1)
        .filter(wallet => !!wallet.identities[cryptoSuiteKey(suite)])
        .map(wallet => (accounts || []).find(l => l.walletID === wallet.id)
            || walletAccount(wallet, suite, { account: '', ecosystems: [] }))
);

const selectWalletAccounts = (state: IRootState): IAccount[] =>
    walletAccounts(state.storage.wallets, state.auth.wallets, state.engine.guestSession ? state.engine.guestSession.cryptoSuite : DEFAULT_CRYPTO_SUITE);

const legacyEntries = memoized((entries: unknown[]) => ({
    legacy: entries.filter(isLegacyWallet),
    damaged: entries.filter(wallet => !isLegacyWallet(wallet)).length
}));

const mapStateToProps = (state: IRootState) => ({
    isOffline: !state.engine.guestSession,
    pending: state.auth.isLoggingIn,
    wallets: selectWalletAccounts(state),
    notifications: state.socket.notifications,
    activationEmail: selectActivationMail(state),
    demoModeEnabled: selectDemoEnabled(state),
    legacyWallets: legacyEntries(state.storage.legacyWallets).legacy,
    damagedWallets: legacyEntries(state.storage.legacyWallets).damaged
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
    onGuestLogin: () => loginGuest.started(undefined),
    onUpgrade: upgradeLegacyWallet.started
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
    onGuestLogin: dispatch.onGuestLogin,
    legacyWallets: state.legacyWallets,
    damagedWallets: state.damagedWallets,
    onUpgrade: dispatch.onUpgrade

}))(WalletList);