import React, { useMemo } from 'react';
import { Area } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { parseISO, isAfter, isBefore } from 'date-fns';
import { Droplet } from 'lucide-react';
import { getDate, getCloud } from '../utils';
import type { WeatherData } from '../../../api/weather';
import type { HourlyDataPoint } from '../types';
import type { ScaleTime, ScaleLinear } from 'd3-scale';

interface CloudLayerProps {
    hourlyData: HourlyDataPoint[];
    dailyData: WeatherData['daily'];
    timeScale: ScaleTime<number, number>;
    cloudScale: ScaleLinear<number, number>;
    cloudCenterY: number;
    xMax: number;
}

export const CloudLayer: React.FC<CloudLayerProps> = ({ hourlyData, dailyData, timeScale, cloudScale, cloudCenterY, xMax }) => {

    // Sunny Intervals (Coalesced rounded rects)
    const sunnyPills = useMemo(() => {
      const pills: React.ReactElement[] = [];
      if (!dailyData || !hourlyData.length) return pills;

      const sunnyIndices: number[] = [];


      hourlyData.forEach((d, i) => {
          const dateStr = d.time.substring(0, 10);
          const dayIndex = dailyData.time.findIndex(dt => dt === dateStr);
          if (dayIndex === -1) return;

          const sunrise = parseISO(dailyData.sunrise[dayIndex]);
          const sunset = parseISO(dailyData.sunset[dayIndex]);
          const currentTime = parseISO(d.time);

          const isDay = isAfter(currentTime, sunrise) && isBefore(currentTime, sunset);
          const sunniness = (100 - d.cloudcover) / 100;

          if (isDay && sunniness > 0.1) {
              sunnyIndices.push(i);
          }
      });

      if (sunnyIndices.length === 0) return pills;


      const ranges: {start: number, end: number}[] = [];
      let currentStart = sunnyIndices[0];
      let currentPrev = sunnyIndices[0];

      for (let i = 1; i < sunnyIndices.length; i++) {
          const idx = sunnyIndices[i];
          if (idx === currentPrev + 1) {
              currentPrev = idx;
          } else {
              ranges.push({ start: currentStart, end: currentPrev });
              currentStart = idx;
              currentPrev = idx;
          }
      }
      ranges.push({ start: currentStart, end: currentPrev });


      const pillWidth = (xMax / 48) * 1.5;
      const padding = pillWidth / 2;

      return ranges.map((range, i) => {
          const startData = hourlyData[range.start];
          const endData = hourlyData[range.end];
          const startX = timeScale(getDate(startData)) ?? 0;
          const endX = timeScale(getDate(endData)) ?? 0;

          // Expand by half-pill-width on both sides to simulate the "coalesced" shape of overlapping pills
          const x = startX - padding;
          const w = (endX + padding) - x;
          const y = cloudCenterY - 22;

          return (
              <rect
                  key={`sun-range-${i}`}
                  x={x}
                  y={y}
                  width={w}
                  height={8}
                  rx={4}
                  fill="#fde047"
                  fillOpacity={0.6}
                  style={{ filter: 'blur(6px)' }}
                  data-part="sunny-pill-group"
              />
          )
      });
    }, [hourlyData, dailyData, timeScale, cloudCenterY, xMax]);


    // Pre-calculate jitter to avoid side-effects in render
    const dropletJitter = useMemo(() => {
        return hourlyData.map((d) => {
             const numDroplets = Math.min(Math.ceil(d.precipitation * 2), 5);
             return Array.from({length: numDroplets}).map(() => Math.random() * 10 - 5);
        });
    }, [hourlyData]);


    return (
        <g data-part="cloud-layer">
            {/* Cloud Cover - Symmetrical Streamgraph Style */}
             <Area
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y0={d => cloudCenterY - (cloudScale(getCloud(d)) ?? 0)}
                y1={d => cloudCenterY + (cloudScale(getCloud(d)) ?? 0)}
                fill="#ffffff"
                fillOpacity={0.15}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                curve={curveMonotoneX}
                data-part="cloud-area"
             />

             {/* Sunny Pills */}
             {sunnyPills}

             {/* Rain Droplets under Cloud */}
             {hourlyData.map((d, index) => {
                 if (d.precipitation <= 0) return null;
                 const x = timeScale(getDate(d)) ?? 0;
                 const cloudBottomY = cloudCenterY + (cloudScale(getCloud(d)) ?? 0);

                 // Render droplets based on intensity
                 const numDroplets = Math.min(Math.ceil(d.precipitation * 2), 5);

                 return dropletJitter[index].slice(0, numDroplets).map((jitter, j) => (
                    <Droplet
                        key={`drop-${d.time}-${j}`}
                        x={x + jitter - 4.5}
                        y={cloudBottomY + 5 + (j * 11)}
                        width={9}
                        height={9}
                        fill="#60a5fa"
                        strokeWidth={0}
                        opacity={0.8}
                        data-part="rain-droplet"
                    />
                 ));
             })}
        </g>
    );
}
