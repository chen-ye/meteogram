import React, { useMemo } from 'react';
import { LinearGradient } from '@visx/gradient';
import { interpolate, formatHex, useMode, modeOklab } from 'culori';
import type { ScaleTime, ScaleLinear } from 'd3-scale';
import { getWindSpeed, getDate } from '../utils';

import type { HourlyDataPoint } from '../types';

// Register OKLab mode
// eslint-disable-next-line react-hooks/rules-of-hooks
useMode(modeOklab);

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

  const gradientStops = useMemo(() => {
    const interpolator = interpolate(['#fbbf24', '#3b82f6'], 'oklab');
    const steps = 10;
    return Array.from({ length: steps }).map((_, i) => {
      const t = i / (steps - 1);
      return {
        offset: `${t * 100}%`,
        color: formatHex(interpolator(t)),
        opacity: 0.2 - t * (0.2 - 0.05), // 0.2 -> 0.05
      };
    });
  }, []);

  return (
    <defs>
      {/* Temp Fill (with opacity) */}
      <linearGradient
        id="temp-fill-gradient"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={yHot}
        x2={0}
        y2={yCold}
      >
        {gradientStops.map((stop, i) => (
          <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
        ))}
      </linearGradient>

      {/* Temp Stroke (Solid) */}
      <linearGradient
        id="temp-stroke-gradient"
        gradientUnits="userSpaceOnUse"
        x1={0}
        y1={yHot}
        x2={0}
        y2={yCold}
      >
        {gradientStops.map((stop, i) => (
          <stop key={i} offset={stop.offset} stopColor={stop.color} stopOpacity={1} />
        ))}
      </linearGradient>

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
