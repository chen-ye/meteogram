import React from 'react';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { getDate, getTemp, getDewPoint } from '../utils';
import { formatTemp, type UnitSystem } from '../../../utils/units';
import type { HourlyDataPoint } from '../types';
import type { ScaleTime, ScaleLinear } from 'd3-scale';

interface TemperatureLayerProps {
  hourlyData: HourlyDataPoint[];
  timeScale: ScaleTime<number, number>;
  tempScale: ScaleLinear<number, number>;
  yMax: number;
  unitSystem: UnitSystem;
}

export const TemperatureLayer: React.FC<TemperatureLayerProps> = ({
  hourlyData,
  timeScale,
  tempScale,
  yMax,
  unitSystem,
}) => {
  return (
    <g data-part="temp-layer">
      {/* Dew Point Line */}
      <LinePath
        data={hourlyData}
        x={(d) => timeScale(getDate(d)) ?? 0}
        y={(d) => tempScale(getDewPoint(d)) ?? 0}
        stroke="#22d3ee"
        strokeWidth={2}
        strokeDasharray="2 4"
        strokeOpacity={0.8}
        curve={curveMonotoneX}
        data-part="dew-point-line"
      />

      {/* Temperature Area Fill */}
      <AreaClosed
        data={hourlyData}
        x={(d) => timeScale(getDate(d)) ?? 0}
        y0={yMax}
        y1={(d) => tempScale(getTemp(d)) ?? 0}
        yScale={tempScale}
        stroke="transparent"
        fill="url(#temp-fill-gradient)"
        curve={curveMonotoneX}
        data-part="temp-area"
      />

      {/* Main Temp Line */}
      <LinePath
        data={hourlyData}
        x={(d) => timeScale(getDate(d)) ?? 0}
        y={(d) => tempScale(getTemp(d)) ?? 0}
        stroke="url(#temp-stroke-gradient)"
        strokeWidth={3}
        curve={curveMonotoneX}
        data-part="temp-line"
      />

      {/* Temp Labels on Line (Max/Min Peaks for each day) */}
      {(() => {
        const days = new Set(hourlyData.map((d) => getDate(d).getDate()));
        const labels: { x: number; y: number; text: string; type: 'min' | 'max' }[] = [];

        days.forEach((day) => {
          const dayData = hourlyData.filter((d) => getDate(d).getDate() === day);
          if (dayData.length === 0) return;

          const minPoint = dayData.reduce((prev, curr) =>
            getTemp(curr) < getTemp(prev) ? curr : prev,
          );

          const maxPoint = dayData.reduce((prev, curr) =>
            getTemp(curr) > getTemp(prev) ? curr : prev,
          );

          labels.push({
            x: timeScale(getDate(maxPoint)) ?? 0,
            y: tempScale(getTemp(maxPoint)) ?? 0,
            text: `${formatTemp(getTemp(maxPoint), unitSystem)}°`,
            type: 'max',
          });
          labels.push({
            x: timeScale(getDate(minPoint)) ?? 0,
            y: tempScale(getTemp(minPoint)) ?? 0,
            text: `${formatTemp(getTemp(minPoint), unitSystem)}°`,
            type: 'min',
          });
        });

        return labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y + (l.type === 'max' ? -10 : 20)}
            textAnchor="middle"
            fill="white"
            fontSize={12}
            fontWeight="bold"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
            data-part={`temp-label-${l.type}`}
          >
            {l.text}
          </text>
        ));
      })()}
    </g>
  );
};
