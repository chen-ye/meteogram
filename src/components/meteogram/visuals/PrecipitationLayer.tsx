import React from 'react';
import { Bar } from '@visx/shape';
import { getDate, getPrecip } from '../utils';
import type { HourlyDataPoint } from '../types';
import type { ScaleTime, ScaleLinear } from 'd3-scale';

interface PrecipitationLayerProps {
    hourlyData: HourlyDataPoint[];
    timeScale: ScaleTime<number, number>;
    precipScale: ScaleLinear<number, number>;
    yMax: number;
}

export const PrecipitationLayer: React.FC<PrecipitationLayerProps> = ({ hourlyData, timeScale, precipScale, yMax }) => {
    return (
        <g data-part="precip-layer">
             {hourlyData.map(d => {
                 const barH = yMax - (precipScale(getPrecip(d)) ?? yMax);
                 if (barH <= 0) return null;
                 return (
                     <Bar
                        key={`p-${d.time}`}
                        x={(timeScale(getDate(d)) ?? 0) - 3}
                        y={yMax - barH}
                        width={6}
                        height={barH}
                        fill="#60a5fa"
                        fillOpacity={0.3}
                        rx={2}
                        data-part="precip-bar"
                     />
                 )
             })}
        </g>
    );
};
