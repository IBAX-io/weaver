/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { connect } from 'react-redux';
import { IRootState } from 'modules';
import { createWallet } from 'modules/auth/actions';
import { ICreateWalletCall } from 'ibax/auth';
import { sendAttachment } from 'modules/io/actions';

import Create from 'components/Auth/Wallet/Create';

const mapStateToProps = (_state: IRootState) => ({
});

const mapDispatchToProps = {
    onCreate: (params: ICreateWalletCall) => createWallet.started(params),
    onDownloadSeed: (seed: string) => sendAttachment({
        name: 'seed.txt',
        data: seed
    })
};

export default connect(mapStateToProps, mapDispatchToProps)(Create);