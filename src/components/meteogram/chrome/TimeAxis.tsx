import React from 'react';
import { AxisBottom } from '@visx/axis';
import { format } from 'date-fns';
import type { ScaleTime } from 'd3-scale';

interface TimeAxisProps {
  timeScale: ScaleTime<number, number>;
  yMax: number;
  height?: number;
}

export const TimeAxis: React.FC<TimeAxisProps> = ({ timeScale, yMax, height = 40 }) => {
  return (
    <AxisBottom
      scale={timeScale}
      top={yMax}
      stroke="transparent"
      tickStroke="transparent"
      tickLength={0}
      numTicks={8}
      tickFormat={(val) => {
        const d = val as Date;
        if (d.getHours() === 0) return format(d, 'EEE').toUpperCase();
        return d.getHours().toString();
      }}
      tickLabelProps={(val) => {
        const isDay = (val as Date).getHours() === 0;
        return {
          fill: isDay ? '#ffffff' : 'rgba(255,255,255,0.5)',
          fontSize: isDay ? 12 : 11,
          fontWeight: isDay ? 700 : 400,
          textAnchor: 'start',
          dx: 4,
          y: 0,
          dy: height / 2,
          dominantBaseline: 'central',
        };
      }}
      data-part="time-axis"
    />
  );
};
