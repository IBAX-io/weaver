/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { IModalProps } from 'components/Modal';
import { switchWallet } from 'modules/auth/actions';
import { modalClose } from 'modules/modal/actions';

import RolePickerModal from 'components/Modal/RolePickerModal';

export interface IRolePickerModalProps {
    account: string;
    ecosystem: string;
}

const mapStateToProps = (state: IRootState, props: IModalProps<IRolePickerModalProps, void>) => ({
    ...props,
    params: {
        account: state.auth.wallet.wallet.address,
        ecosystem: props.params.ecosystem,
        ecosystemName: state.auth.wallets
            .find(w => w.id === state.auth.wallet.wallet.id).access.find(a => a.ecosystem === props.params.ecosystem).name,
        roles: state.auth.wallets
            .find(w => w.id === state.auth.wallet.wallet.id).access.find(a => a.ecosystem === props.params.ecosystem).roles
    }
});

export default connect(mapStateToProps, {
    onSwitchWallet: switchWallet,
    modalClose: modalClose

}, (state, dispatch: any, props) => ({
    ...state,
    onSwitchWallet: (role: string) => {
        dispatch.modalClose({
            reason: 'CLOSE',
            data: null
        });
        dispatch.onSwitchWallet({
            ecosystem: props.params.ecosystem,
            role
        });
    }
}))(RolePickerModal);