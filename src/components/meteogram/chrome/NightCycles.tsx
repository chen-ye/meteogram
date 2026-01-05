import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { parseISO, isBefore } from 'date-fns';
import type { WeatherData } from '../../../api/weather';
import type { ScaleTime } from 'd3-scale';

interface NightCyclesProps {
    data: WeatherData;
    timeScale: ScaleTime<number, number>;
    xMax: number;
    height: number;
    chartStart: Date;
}

export const NightCycles: React.FC<NightCyclesProps> = ({ data, timeScale, xMax, height, chartStart }) => {
  const nightRects = useMemo(() => {
    const rects: React.ReactElement[] = [];
    if (!data.daily || !data.daily.sunrise || !data.daily.sunset) return rects;

    data.daily.time.forEach((_: string, i: number) => {
        const sunset = parseISO(data.daily.sunset[i]);
        const nextSunriseStr = data.daily.sunrise[i+1];
        const nextSunrise = nextSunriseStr ? parseISO(nextSunriseStr) : null;


        if (sunset && nextSunrise) {
             const xStart = timeScale(sunset);
             const xEnd = timeScale(nextSunrise);

             if (xStart < xMax && xEnd > 0) {
                 rects.push(
                     <rect
                         key={`night-${i}`}
                         x={Math.max(0, xStart)}
                         y={0}
                         width={Math.min(xMax, xEnd) - Math.max(0, xStart)}
                         height={height}
                         fill="#000000"
                         fillOpacity={0.2}
                         style={{ filter: 'blur(16px)' }}
                         data-part="night-shading-rect"
                     />
                 )
             }
        }

        // Check "night before first sunrise" (first day only)
        if (i === 0) {
             const sunrise = parseISO(data.daily.sunrise[0]);
             if (isBefore(chartStart, sunrise)) {
                 const xStart = timeScale(chartStart);
                 const xEnd = timeScale(sunrise);
                 if (xEnd > 0) {
                    rects.push(
                        <rect
                            key={`night-early`}
                            x={Math.max(0, xStart)}
                            y={0}
                            width={xEnd - Math.max(0, xStart)}
                            height={height}
                            fill="#000000"
                            fillOpacity={0.2}
                            style={{ filter: 'blur(16px)' }}
                            data-part="night-shading-rect-early"
                        />
                    )
                 }
             }
        }
    });

    return rects;
  }, [data.daily, timeScale, xMax, height, chartStart]);

  return <Group className="night-cycles" data-part="night-cycles">{nightRects}</Group>;
};
