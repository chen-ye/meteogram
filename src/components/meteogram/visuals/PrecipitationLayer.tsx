import React from 'react';
import { Bar } from '@visx/shape';
import { getDate, getPrecip, getSnowRatio } from '../utils';
import type { HourlyDataPoint } from '../types';
import type { ScaleTime, ScaleLinear } from 'd3-scale';

interface PrecipitationLayerProps {
  hourlyData: HourlyDataPoint[];
  timeScale: ScaleTime<number, number>;
  precipScale: ScaleLinear<number, number>;
  yMax: number;
}

export const PrecipitationLayer: React.FC<PrecipitationLayerProps> = ({
  hourlyData,
  timeScale,
  precipScale,
  yMax,
}) => {
  return (
    <g data-part="precip-layer">
      {hourlyData.map((d) => {
        const totalPrecip = getPrecip(d);
        if (totalPrecip <= 0) return null;

        const barTotalH = yMax - (precipScale(totalPrecip) ?? yMax);
        if (barTotalH <= 0) return null;

        // Calculate liquid vs solid portion
        const snowRatio = getSnowRatio(d);
        const liquidRatio = 1 - snowRatio;
        const barLiquidH = barTotalH * liquidRatio;

        const x = (timeScale(getDate(d)) ?? 0) - 3;
        const yTotal = yMax - barTotalH;
        const yLiquid = yMax - barLiquidH;

        return (
          <React.Fragment key={`p-${d.time}`}>
            {/* Snow Part (Rendered as full bar background, visible at top if liquid < total) */}
            <Bar
              x={x}
              y={yTotal}
              width={6}
              height={barTotalH}
              fill="#ffffff"
              fillOpacity={0.9}
              rx={2}
              data-part="precip-bar-snow"
            />
            {/* Rain Part (Overlay at bottom) */}
            {barLiquidH > 0 && (
              <Bar
                x={x}
                y={yLiquid}
                width={6}
                height={barLiquidH}
                fill="#60a5fa"
                fillOpacity={0.9}
                rx={2}
                data-part="precip-bar-rain"
              />
            )}
          </React.Fragment>
        );
      })}
    </g>
  );
};
