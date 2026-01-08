import React from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import type { ScaleTime } from 'd3-scale';

interface CurrentTimeLineProps {
  timeScale: ScaleTime<number, number>;
  height: number;
}

export const CurrentTimeLine: React.FC<CurrentTimeLineProps> = ({ timeScale, height }) => {
  const now = new Date();
  const x = timeScale(now);

  if (x === undefined) return null;

  return (
    <Group left={x} top={0}>
      {/* Solid Alpha Line */}
      <Line
        from={{ x: 0, y: 0 }}
        to={{ x: 0, y: height + 12 }}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
        pointerEvents="none"
        data-part="current-time-line"
      />
    </Group>
  );
};
