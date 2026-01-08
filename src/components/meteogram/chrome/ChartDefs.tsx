import React from 'react';
import { LinearGradient } from '@visx/gradient';
import type { ScaleTime, ScaleLinear } from 'd3-scale';
import { getWindSpeed, getDate } from '../utils';

import type { HourlyDataPoint } from '../types';

interface ChartDefsProps {
  width: number;
  height: number;
  hourlyData: HourlyDataPoint[];
  timeScale: ScaleTime<number, number>;
  tempScale: ScaleLinear<number, number>;
  windSpeedScale: ScaleLinear<number, number>;
}

export const ChartDefs: React.FC<ChartDefsProps> = ({
  width,
  height,
  hourlyData,
  timeScale,
  tempScale,
  windSpeedScale,
}) => {
  // Absolute Gradient Anchors (Celcius)
  // 40°C = Hot (Amber), -10°C = Cold (Blue)
  const yHot = tempScale(40) ?? 0;
  const yCold = tempScale(-10) ?? height;

  return (
    <defs>
      <LinearGradient
        id="temp-fill-gradient"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={yHot}
        x2={0}
        y2={yCold}
        from="#fbbf24"
        to="#3b82f6"
        fromOpacity={0.2}
        toOpacity={0.05}
      />
      <LinearGradient
        id="temp-stroke-gradient"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={yHot}
        x2={0}
        y2={yCold}
        from="#fbbf24"
        to="#3b82f6"
      />
      <LinearGradient id="dew-stroke-gradient" from="#22d3ee" to="#22d3ee" />
      <LinearGradient
        id="precip-gradient"
        from="#3b82f6"
        to="#3b82f6"
        fromOpacity={0.8}
        toOpacity={0.1}
      />

      <mask id="wind-line-mask">
        <rect x={0} y={0} width={width} height={height} fill="white" />
        {hourlyData.map((d, i) => {
          if (i % 2 !== 0) return null;
          const x = timeScale(getDate(d)) ?? 0;
          const y = windSpeedScale(getWindSpeed(d)) ?? 0;
          return (
            <circle
              key={`mask-${i}`}
              cx={x}
              cy={y}
              r={10}
              fill="black"
              data-part="wind-mask-circle"
            />
          );
        })}
      </mask>
    </defs>
  );
};
