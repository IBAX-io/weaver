/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import Transition from 'react-transition-group/Transition';
import themed from 'components/Theme/themed';
import platform from 'lib/platform';

const containerAnimationDuration = 210;
const containerAnimationDef = {
    defaultStyle: {
        transition: 'opacity .21s ease-in-out',
        opacity: 0
    },

    entering: {
        height: 'auto',
        display: 'block',
        opacity: 1
    },
    entered: {
        opacity: 1
    },

    exiting: {
        opacity: 0
    },

    exited: {
        height: 0,
        padding: 0,
        margin: 0,
        opacity: 0
    }
};

const childAnimationDuration = 210;
const childAnimationDef = {
    defaultStyle: {
        transform: 'translateY(-30px)',
        transition: 'transform .21s ease-in-out, opacity .21s ease-in-out',
        opacity: 0
    },

    entering: {
        transform: 'translateY(0)',
        opacity: 1
    },

    entered: {
        transform: 'translateY(0)',
        opacity: 1
    },

    exiting: {
        transform: 'translateY(30px)',
        opacity: 0
    }
};

const StyledModalWrapper = themed.div`
    background: rgba(0,0,0,0.3);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9000;
    text-align: center;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 50px;
    margin-top: ${props => props.theme.headerHeight + (platform.select({ win32: 1 }) || 0)}px;

    &::before {
        content: ' ';
        display: inline-block;
        height: 100%;
        width: 1px;
        vertical-align: middle;
        font-size: 0;
    }

    > .modal-wnd {
        display: inline-block;
        border: solid 1px ${props => props.theme.modalOutline};
        background: #fff;
        vertical-align: middle;
        text-align: initial;
        max-width: 95%;
        overflow: hidden;
    }
`;

export interface IModalWrapperProps {

}

interface IModalWrapperState {
    active: boolean;
    activeModal: React.ReactNode;
    queuedModal: React.ReactNode;
}

class ModalWrapper extends React.Component<IModalWrapperProps, IModalWrapperState> {
    private _exited = false;

    constructor(props: IModalWrapperProps) {
        super(props);
        this.state = {
            activeModal: null,
            queuedModal: null,
            active: false
        };
    }

    componentDidMount() {
        this.enqueueModal(this.props.children);
    }

    componentWillReceiveProps(props: IModalWrapperProps & { children: React.ReactNode }) {
        if (!this.props.children) {
            this.enqueueModal(props.children);
        }
        else {
            const updateProc = (this.props.children as any || {}).key === (props.children as any || {}).key;
            if (updateProc) {
                this.setState({
                    activeModal: props.children
                });
            }
            else {
                this.enqueueModal(props.children);
            }
        }
    }

    onEntered = () => {
        if (this.state.queuedModal) {
            this.setState({
                active: false
            });
        }
    }

    onExited = () => {
        this._exited = true;
        if (this.state.queuedModal) {
            this._exited = false;
            this.setState({
                active: true,
                activeModal: this.state.queuedModal,
                queuedModal: null
            });
        }
    }

    enqueueModal = (node: React.ReactNode) => {
        if (this.state.activeModal && !this._exited) {
            this.setState({
                active: false,
                queuedModal: node
            });
        }
        else if (node) {
            this._exited = false;
            this.setState({
                active: true,
                activeModal: node
            });
        }
        else {
            this.setState({
                active: false,
                activeModal: node
            });
        }
    }

    renderChild(state: string) {
        return (
            <div className="modal-wnd" style={{ ...childAnimationDef.defaultStyle, ...childAnimationDef[state] }}>
                {this.state.activeModal}
            </div>
        );
    }

    render() {
        return (
            <Transition in={this.state.active} timeout={containerAnimationDuration} onEntered={this.onEntered} onExited={this.onExited} unmountOnExit>
                {(state: string) => (
                    <StyledModalWrapper style={{ ...containerAnimationDef.defaultStyle, ...containerAnimationDef[state] }}>
                        <Transition in={state === 'entered'} timeout={childAnimationDuration}>
                            {this.renderChild.bind(this)}
                        </Transition>
                    </StyledModalWrapper>
                )}
            </Transition>

        );
    }
}

export default ModalWrapper;