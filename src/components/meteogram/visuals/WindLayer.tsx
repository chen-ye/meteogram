import React from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { getDate, getWindSpeed } from '../utils';
import type { HourlyDataPoint } from '../types';
import type { ScaleTime, ScaleLinear } from 'd3-scale';

interface WindLayerProps {
    hourlyData: HourlyDataPoint[];
    timeScale: ScaleTime<number, number>;
    windSpeedScale: ScaleLinear<number, number>;
}

export const WindLayer: React.FC<WindLayerProps> = ({ hourlyData, timeScale, windSpeedScale }) => {
    return (
        <g data-part="wind-layer">
             {/* Wind Speed Line - MASKED Connecting Line (Thicker) */}
             <LinePath
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y={d => windSpeedScale(getWindSpeed(d)) ?? 0}
                stroke="#ef4444"
                strokeWidth={2} // Thicker [NEW]
                strokeOpacity={0.8}
                curve={curveMonotoneX}
                mask="url(#wind-line-mask)" // Apply Mask [NEW]
                data-part="wind-line"
             />

             {/* Wind Stream Arrows - Positioned on the line WITHOUT knockout circle */}
             {hourlyData.map((d, i) => {
                 if (i % 2 !== 0) return null; // Every 2nd hour
                 const x = timeScale(getDate(d)) ?? 0;
                 const y = windSpeedScale(getWindSpeed(d)) ?? 0;

                 return (
                     <Group key={`w-${d.time}`} top={y} left={x} data-part="wind-arrow">
                         {/* Rotate arrow to point with wind direction */}
                         <g transform={`rotate(${d.winddirection_10m + 180})`}>
                              <path d="M0,4 L3,-4 L0,-2 L-3,-4 Z" fill="#ef4444" />
                         </g>
                     </Group>
                 )
             })}
        </g>
    );
};
