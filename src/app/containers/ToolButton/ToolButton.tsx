/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import uuid from 'uuid';
import { connect, ConnectedProps } from 'react-redux';
import { buttonInteraction } from 'modules/content/actions';

import ToolButton from 'components/Protypo/components/ToolButton';
import { ProtypoContext } from 'components/Protypo/ProtypoContext';

export interface IToolButtonProps {
    title?: string;
    icon?: string;
    // Redirect if all previous actions succeeded
    page?: string;
    pageparams?: {
        [name: string]: string;
    };

    // Page must be rendered within a modal dialog
    popup?: {
        header?: string;
        width?: string;
    };
}

const connector = connect(null, { buttonInteraction });

type TToolButtonContainerProps = IToolButtonProps & ConnectedProps<typeof connector>;

class ToolButtonContainer extends React.Component<TToolButtonContainerProps> {
    private _uuid: string = null;

    static contextType = ProtypoContext;
    declare context: React.ContextType<typeof ProtypoContext>;

    onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        this._uuid = uuid.v4();

        const pageParams = this.props.pageparams;

        if (null === pageParams) {
            return;
        }

        let popup: { title?: string, width?: number } = null;
        if (this.props.popup) {
            const width = parseInt(this.props.popup.width, 10);
            popup = {
                title: this.props.popup.header,
                width: width === width ? width : null
            };
        }

        this.props.buttonInteraction({
            uuid: this._uuid,
            popup,
            actions: [],
            contracts: [],
            from: this.context.protypo.getFromContext(this.props.title),
            page: this.props.page ? {
                name: this.props.page,
                section: this.context.section,
                params: pageParams
            } : null
        });
    }

    render() {
        return (
            <ToolButton {...this.props} onClick={this.onClick} />
        );
    }
}

export default connector(ToolButtonContainer);