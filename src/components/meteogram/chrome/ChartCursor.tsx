import React from 'react';
import { Line } from '@visx/shape';

interface ChartCursorProps {
    tooltipOpen: boolean;
    tooltipLeft: number | undefined;
    margin: { left: number };
    yMax: number;
}

export const ChartCursor: React.FC<ChartCursorProps> = ({ tooltipOpen, tooltipLeft, margin, yMax }) => {
    if (!tooltipOpen) return null;

    return (
         <Line
            from={{x: (tooltipLeft ?? 0) - margin.left, y: 0}}
            to={{x: (tooltipLeft ?? 0) - margin.left, y: yMax}}
            stroke="white"
            strokeWidth={1}
            strokeDasharray="4 2"
            pointerEvents="none"
            data-part="cursor-line"
         />
    );
};
