/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import { connect } from 'react-redux';
import { IRootState } from 'modules';

import Avatar from 'components/Avatar';

interface IAvatarContainerProps {
    className?: string;
    account: string;
    ecosystem: string;
    size?: number;
}

interface IAvatarContainerState {
    nodeHost: string;
}

interface IAvatarContainerDispatch {

}

const AvatarContainer: React.SFC<IAvatarContainerProps & IAvatarContainerState & IAvatarContainerDispatch> = props => (
    <Avatar
        className={props.className}
        size={props.size}
        url={`${props.nodeHost}/api/v2/avatar/${props.ecosystem}/${props.account}`}
    />
);

const mapStateToProps = (state: IRootState) => ({
    nodeHost: state.engine.guestSession.network.apiHost
});

const mapDispatchToProps = {
};

export default connect<IAvatarContainerState, IAvatarContainerDispatch, IAvatarContainerProps>(mapStateToProps, mapDispatchToProps)(AvatarContainer);