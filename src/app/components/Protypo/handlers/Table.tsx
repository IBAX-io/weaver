/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import _ from 'lodash';
import React from 'react';
import propTypes from 'prop-types';
import { TProtypoElement, ISource } from 'ibax/protypo';

import StyledComponent from './StyledComponent';
import LongText from 'components/Protypo/components/LongText';
import BlobData from 'components/Protypo/components/BlobData';

export interface ITableProps {
    id: string;
    className?: string;
    source?: string;
    columns?: { Name: string, Title: string }[];
}

interface ITableContext {
    resolveSource: (name: string) => ISource;
    renderElements: (elements: TProtypoElement[], keyPrefix?: string) => React.ReactNode[];
}

class Table extends React.Component<ITableProps> {
    private _cachedSourceData: ISource;

    static contextTypes = {
        resolveSource: propTypes.func.isRequired,
        renderElements: propTypes.func.isRequired
    };

    shouldComponentUpdate(props: ITableProps, state: never, context: ITableContext) {
        const source = context.resolveSource(props.source);
        return !_.isEqual(props, this.props) || !_.isEqual(this._cachedSourceData, source);
    }

    render() {
        const context = this.context as ITableContext;

        this._cachedSourceData = context.resolveSource(this.props.source);

        if (!this._cachedSourceData) {
            return null;
        }

        let columns: { title: string, index: number }[] = [];
        if (this.props.columns) {
            this.props.columns.forEach(col => {
                const index = this._cachedSourceData.columns.indexOf(col.Name);
                if (-1 !== index) {
                    columns.push({
                        title: col.Title,
                        index
                    });
                }
            });
        }
        else {
            columns = this._cachedSourceData.columns.map((col, index) => ({
                title: col,
                index
            }));
        }

        // TODO: Move this handler to Protypo. We'll maybe need to use it in the future
        // for now it's just an exception
        const renderValue = (value: any, type: string) => {
            switch (type) {
                // Default is on top because of linter bug that is warning about break statement
                default:
                    return null;

                case 'text':
                    return value;

                case 'blob':
                    try {
                        const payload: { title: string, link: string } = JSON.parse(value);
                        return (
                            <BlobData link={payload.link}>{payload.title}</BlobData>
                        );
                    }
                    catch {
                        return null;
                    }

                case 'long_text':
                    try {
                        const payload: { title: string, link: string } = JSON.parse(value);
                        return payload.link ? (
                            <LongText link={payload.link}>{payload.title}</LongText>
                        ) : payload.title;
                    }
                    catch {
                        return null;
                    }

                case 'tags':
                    try {
                        const payload = JSON.parse(value);
                        return context.renderElements(payload, this.props.id);
                    }
                    catch {
                        return null;
                    }
            }
        };

        return (
            <table className={['table', this.props.className].join(' ')}>
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index}>{col.title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {this._cachedSourceData.data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((col) => (
                                <td key={col.index}>
                                    {renderValue(row[col.index], this._cachedSourceData.types[col.index])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
}

export default StyledComponent(Table);