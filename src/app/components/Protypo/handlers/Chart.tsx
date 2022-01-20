/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as _ from 'lodash';
import * as React from 'react';
import * as propTypes from 'prop-types';
import { ISource, TChartType } from 'ibax/protypo';
import ChartComponent, { Bar, Line, Pie } from 'react-chartjs-2';

import StyledComponent from './StyledComponent';

export interface IChartProps {
    id: string;
    colors?: string[];
    fieldlabel?: string;
    fieldvalue?: string;
    source?: string;
    type?: TChartType;
}

interface IChartContext {
    resolveSource: (name: string) => ISource;
}

const chartTypes: { [K in TChartType]: new () => ChartComponent<any> } = {
    bar: Bar,
    line: Line,
    pie: Pie
};

class Chart extends React.Component<IChartProps> {
    private _cachedSourceData: ISource;

    static contextTypes = {
        resolveSource: propTypes.func.isRequired
    };

    shouldComponentUpdate(props: IChartProps, state: never, context: IChartContext) {
        const source = context.resolveSource(props.source);
        return !_.isEqual(props, this.props) || !_.isEqual(this._cachedSourceData, source);
    }

    render() {
        const context: IChartContext = this.context;

        this._cachedSourceData = context.resolveSource(this.props.source);

        if (!this._cachedSourceData) {
            return null;
        }

        const fieldLabelRowIndex = this._cachedSourceData.columns.indexOf(this.props.fieldlabel);
        const fieldValueRowIndex = this._cachedSourceData.columns.indexOf(this.props.fieldvalue);

        if (fieldValueRowIndex === -1 || fieldLabelRowIndex === -1) {
            return null;
        }

        const labels = this._cachedSourceData.data.map((row, rowIndex) => (
            row[fieldLabelRowIndex]
        ));

        const data = this._cachedSourceData.data.map((row, rowIndex) => (
            parseFloat(row[fieldValueRowIndex])
        ));

        let chartData: any = {
            labels,
            datasets: [
                {
                    label: '',
                    data,
                    borderWidth: 2,
                    backgroundColor: this.props.colors
                }
            ]
        };

        if (this.props.type === 'line') {
            if (this.props.colors && this.props.colors.length > 0) {
                chartData.datasets[0].borderColor = this.props.colors[0];
                chartData.datasets[0].backgroundColor = null;
            }
        }

        const options = {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        };

        const ChartType = chartTypes[this.props.type];

        if (ChartType) {
            return (
                <div>
                    <ChartType
                        data={chartData}
                        options={options}
                    />
                </div>
            );
        }
        return null;
    }
}

export default StyledComponent(Chart);