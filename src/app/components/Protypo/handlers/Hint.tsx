/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import themed from 'components/Theme/themed';
import Tooltip from 'components/Tooltip';

export interface IHintProps {
    'icon'?: string;
    'title'?: string;
    'text'?: string;
}

export const HintWrapper = themed.div`
    display: inline-block;
    width: 40px;
    line-height: 40px;
    text-align: center;
    
    .tool-body {
        min-width: 40px;
        height: 40px;
        padding: 0 12px;
        font-weight: 300;

        em.tool-icon {
            color: #5b97e4,
            transition: color .15s;
            vertical-align: middle;
            height: 18px;
            display: inline-block;
        }

        > span.button-label {
            margin-left: 8px;
            color: #fff;
        }

        &:hover {
            em.tool-icon {
                color: #a9ccf9;
            }
        }
    }
`;

class Hint extends React.Component<IHintProps> {
    render() {
        return (
            <HintWrapper>
                <Tooltip title={this.props.title} body={this.props.text}>
                    <div className="tool-body">
                        <em className={`tool-icon ${this.props.icon || 'icon-question'}`} />
                        {this.props.children && (<span className="button-label">{this.props.children}</span>)}
                    </div>
                </Tooltip>
            </HintWrapper>
        );
    }
}

export default Hint;
