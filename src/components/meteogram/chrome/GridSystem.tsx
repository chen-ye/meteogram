import React from 'react';
import { Group } from '@visx/group';
import { Line } from '@visx/shape';
import type { ScaleTime } from 'd3-scale';

interface GridSystemProps {
  timeScale: ScaleTime<number, number>;
  yMax: number;
}

export const GridSystem: React.FC<GridSystemProps> = ({ timeScale, yMax }) => {
  return (
    <Group className="grid-system" data-part="grid-system">
      {timeScale.ticks(8).map((t) => {
        const isMidnight = t.getHours() === 0;
        return (
          <g key={`grid-${t.getTime()}`}>
            <Line
              from={{ x: timeScale(t), y: 0 }}
              to={{ x: timeScale(t), y: yMax }}
              stroke={isMidnight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isMidnight ? 1.5 : 1}
              strokeDasharray={isMidnight ? undefined : '4 4'}
            />
          </g>
        );
      })}
    </Group>
  );
};
