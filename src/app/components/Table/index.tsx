/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as React from 'react';
import * as classNames from 'classnames';
import styled from 'styled-components';

const StyledHead = styled.thead`
    background: #eee;

    > tr > th {
        padding: 0 !important;
        height: 41px;
        line-height: normal !important;
        vertical-align: middle !important;

        > span, > button {
            position: relative;
            padding: 8px 20px 9px !important;
            font-weight: 300;
            font-size: 14px;
            width: 100%;
            height: 100%;
            border: 0;
            padding: 0;
            margin: 0;
            text-align: left;
            background: transparent;
            transition: background .18s;
            color: #333;
            text-overflow: ellipsis;

            > span {
                display: inline-block;
                width: 100%;
                padding-right: 20px;
            }

            > .icon-sort {
                position: absolute;
                font-size: 10px;
                color: #bbb;
                right: 10px;
                top: 3px;
                bottom: 0;

                &:after {
                    height: 100%;
                    width: 0;
                    display: inline-block;
                    content: ' ';
                    vertical-align: middle;
                }
            }
        }

        > button:hover {
            background: #f3f3f5;
        }

        > button:active {
            background: #f0f0f0;
        }
    }
`;

const StyledBody = styled.tbody`
    > tr > td {
        word-break: break-all;
        padding: 8px 20px !important;
        font-weight: 400;
        font-size: 13px;
        color: #666;
    }

    &.tbody-collapse {
        > tr > td:last-child {
            padding-right: 0 !important;
        }
        
        > tr > td {
            padding-left: 0 !important;
        }
    }
`;

export interface ICellRenderer {
    (value: any, rowData: IRowData): JSX.Element | any;
}

export interface IColData {
    title?: string;
    sortable?: boolean;
    width?: number | string;
}

export interface IRowData {
    colIndex: number;
    rowIndex: number;
    rowData: any[];
}

export interface ITableProps {
    columns: IColData[];
    data: any[][];
    renderCell?: ICellRenderer;
    className?: string;
    striped?: boolean;
    bordered?: boolean;
    hover?: boolean;
    collapse?: boolean;
}

interface ITableState {
    sorter: {
        columnIndex: number;
        descending: boolean;
    };
}

class Table extends React.Component<ITableProps, ITableState> {
    constructor(props: ITableProps) {
        super(props);
        this.state = {
            sorter: this.getDefaultSorter()
        };
    }

    getDefaultSorter() {
        for (let i = 0; i < this.props.columns.length; i++) {
            if (this.props.columns[i].sortable) {
                return {
                    columnIndex: i,
                    descending: false
                };
            }
        }

        return null;
    }

    setSorter(columnIndex: number) {
        this.setState({
            sorter: {
                columnIndex,
                descending: this.state.sorter && this.state.sorter.columnIndex === columnIndex && !this.state.sorter.descending
            }
        });
    }

    getSortedData() {
        if (!this.state.sorter) {
            return this.props.data;
        }
        else {
            return this.props.data.sort((left, right) => {
                let valueA: any = left[this.state.sorter.columnIndex].toString();
                let valueB: any = right[this.state.sorter.columnIndex].toString();

                if (valueA === valueB) {
                    return 0;
                }

                const valueANumeric = parseInt(valueA, 10);
                const valueBNumeric = parseInt(valueB, 10);

                // Check if both values are not NaN
                if (valueANumeric === valueANumeric && valueBNumeric === valueBNumeric) {
                    valueA = valueANumeric;
                    valueB = valueBNumeric;
                }

                if (this.state.sorter.descending) {
                    return valueB > valueA ? 1 : -1;
                }
                else {
                    return valueB > valueA ? -1 : 11;
                }
            });
        }
    }

    renderCell(rowIndex: number, colIndex: number) {
        const value = this.props.data[rowIndex][colIndex];

        if (this.props.renderCell) {
            return this.props.renderCell(value, {
                colIndex,
                rowIndex,
                rowData: this.props.data[rowIndex]
            });
        }
        else {
            return value;
        }
    }

    renderColumn(column: IColData, columnIndex: number) {
        if (column.sortable) {
            const iconClasses = classNames({
                'icon-arrow-down': this.state.sorter && this.state.sorter.columnIndex === columnIndex && this.state.sorter.descending,
                'icon-arrow-up': this.state.sorter && this.state.sorter.columnIndex === columnIndex && !this.state.sorter.descending
            });

            return (
                <button type="button" onClick={this.setSorter.bind(this, columnIndex)}>
                    <span>{column.title}</span>
                    <em className="icon-sort">
                        <em className={iconClasses} />
                    </em>
                </button>
            );
        }
        else {
            return (
                <span>
                    {column.title}
                </span>
            );
        }
    }

    render() {
        const classes = classNames({
            'table': true,
            'table-striped': this.props.striped,
            'table-bordered': this.props.bordered,
            'table-hover': this.props.hover
        });

        return (
            <table className={`${classes} ${this.props.className || ''}`}>
                <StyledHead>
                    <tr>
                        {this.props.columns.map((col, colIndex) => (
                            <th key={colIndex} style={{ width: col.width }}>
                                {this.renderColumn(col, colIndex)}
                            </th>
                        ))}
                    </tr>
                </StyledHead>
                <StyledBody className={this.props.collapse ? 'tbody-collapse' : ''}>
                    {this.getSortedData().map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {this.props.columns.map((col, colIndex) => (
                                <td key={colIndex}>
                                    {this.renderCell(rowIndex, colIndex)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </StyledBody>
            </table>
        );
    }
}

export default Table;