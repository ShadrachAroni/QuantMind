declare module 'react-native-svg-charts' {
    import { Component } from 'react';
    import { ViewStyle } from 'react-native';

    export interface PieChartProps {
        data: any[];
        style?: ViewStyle;
        innerRadius?: number | string;
        outerRadius?: number | string;
        padAngle?: number;
        startAngle?: number;
        endAngle?: number;
        valueAccessor?: (args: { item: any }) => number;
        sort?: (a: any, b: any) => number;
        children?: React.ReactNode;
    }

    export class PieChart extends Component<PieChartProps> {}

    export interface LineChartProps {
        data: any[];
        style?: ViewStyle;
        [key: string]: any;
    }
    export class LineChart extends Component<LineChartProps> {}

    export interface BarChartProps {
        data: any[];
        style?: ViewStyle;
        [key: string]: any;
    }
    export class BarChart extends Component<BarChartProps> {}

    // Allow other exports as any
    const _any: any;
    export default _any;
}
