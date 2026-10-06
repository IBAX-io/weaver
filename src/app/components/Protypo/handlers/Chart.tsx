/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as _ from 'lodash';
import * as React from 'react';
import { ISource, TChartType } from 'ibax/protypo';
import {
    Chart as ChartJS,
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    ChartData,
    ChartOptions,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PieController,
    PointElement,
    Tooltip
} from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';

import { ProtypoContext } from 'components/Protypo/ProtypoContext';
import StyledComponent from './StyledComponent';

ChartJS.register(
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PieController,
    PointElement,
    Tooltip
);

export interface IChartProps {
    id: string;
    colors?: string[];
    fieldlabel?: string;
    fieldvalue?: string;
    source?: string;
    type?: TChartType;
}

interface IChartViewProps extends IChartProps {
    sourceData: ISource;
}

const chartTypes: readonly TChartType[] = ['bar', 'line', 'pie'];

// Axis options only apply to cartesian charts; Chart.js 4 would draw axes on a pie chart if given scales
const cartesianOptions: ChartOptions<'bar' | 'line'> = {
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

const ChartView: React.FC<IChartViewProps> = props => {
    const { sourceData, type, colors } = props;
    const fieldLabelRowIndex = sourceData.columns.indexOf(props.fieldlabel);
    const fieldValueRowIndex = sourceData.columns.indexOf(props.fieldvalue);

    if (fieldValueRowIndex === -1 || fieldLabelRowIndex === -1 || !chartTypes.includes(type)) {
        return null;
    }

    const labels = sourceData.data.map(row => row[fieldLabelRowIndex]);
    const data = sourceData.data.map(row => parseFloat(row[fieldValueRowIndex]));
    const isLineWithColors = 'line' === type && colors && colors.length > 0;

    const chartData: ChartData<TChartType, number[], string> = {
        labels,
        datasets: [
            isLineWithColors ? {
                label: '',
                data,
                borderWidth: 2,
                borderColor: colors[0]
            } : {
                label: '',
                data,
                borderWidth: 2,
                backgroundColor: colors
            }
        ]
    };

    return (
        <div>
            <ReactChart
                type={type}
                data={chartData}
                options={'pie' === type ? {} : cartesianOptions}
            />
        </div>
    );
};

// Re-render (and re-animate) the chart only when its props or the source rows actually change
const MemoChartView = React.memo(ChartView, _.isEqual);

const Chart: React.FC<IChartProps> = props => {
    const { resolveSource } = React.useContext(ProtypoContext);
    const sourceData = resolveSource(props.source);

    if (!sourceData) {
        return null;
    }

    return (
        <MemoChartView {...props} sourceData={sourceData} />
    );
};

export default StyledComponent(Chart);
