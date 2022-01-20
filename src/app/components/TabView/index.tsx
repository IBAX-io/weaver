/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import styled from 'styled-components';

const Tab = styled.div`
    overflow-y: auto;
`;

export interface ITabViewProps {
    tabs: string[];
    children: JSX.Element[];
    className?: string;
    tabsClassName?: string;
    wrapperClassName?: string;
    paneClassName?: string;
}

interface ITabViewState {
    tabIndex: number;
}

export default class TabView extends React.Component<ITabViewProps, ITabViewState> {
    constructor(props: ITabViewProps) {
        super(props);
        this.state = {
            tabIndex: 0
        };
    }

    onTabSwitch(tabIndex: number) {
        this.setState({
            tabIndex
        });
    }

    render() {
        return (
            <Tab className={`${this.props.wrapperClassName || ''}`}>
                <ul className={`nav nav-tabs ${this.props.tabsClassName || ''}`}>
                    {this.props.tabs.map((tab, index) => (
                        <li key={index} className={`uib-tab ${index === this.state.tabIndex ? 'active' : ''}`}>
                            <a href="javascript:void(0)" onClick={this.onTabSwitch.bind(this, index)}>{tab}</a>
                        </li>
                    ))}
                </ul>
                <div className={`tab-content ${this.props.className || ''}`}>
                    {this.props.children.map((element, index) => (
                        <div key={index} className={`tab-pane ${this.props.paneClassName || ''} ${this.state.tabIndex === index ? 'active' : ''}`}>
                            {element}
                        </div>
                    ))}
                </div>
            </Tab>
        );
    }
}