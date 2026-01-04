import React, { useCallback } from 'react';
import { Group } from '@visx/group';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { format, parseISO } from 'date-fns';
import { Thermometer, Droplet, Wind, Cloud } from 'lucide-react';

import { useMeteogramData } from './meteogram/hooks/useMeteogramData';
import { useMeteogramScales } from './meteogram/hooks/useMeteogramScales';
import { MARGIN, getDate, bisectDate, getTemp } from './meteogram/utils';
import { getUnitLabel, formatTemp, formatPrecip, formatSpeed } from '../utils/units';
import type { MeteogramProps, HourlyDataPoint } from './meteogram/types';

// Chrome
import { ChartDefs } from './meteogram/chrome/ChartDefs';
import { GridSystem } from './meteogram/chrome/GridSystem';
import { TimeAxis } from './meteogram/chrome/TimeAxis';
import { NightCycles } from './meteogram/chrome/NightCycles';
import { CurrentTimeLine } from './meteogram/chrome/CurrentTimeLine';
import { ChartCursor } from './meteogram/chrome/ChartCursor';

// Visuals
import { CloudLayer } from './meteogram/visuals/CloudLayer';
import { PrecipitationLayer } from './meteogram/visuals/PrecipitationLayer';
import { TemperatureLayer } from './meteogram/visuals/TemperatureLayer';
import { WindLayer } from './meteogram/visuals/WindLayer';

export function Meteogram({ data, width, height, unitSystem }: MeteogramProps) {
  // 1. Data Processing
  const hourlyData = useMeteogramData(data);

  // 2. Scales & Dimensions
  const {
    timeScale,
    tempScale,
    precipScale,
    cloudScale,
    windSpeedScale,
    xMax,
    yMax,
    cloudCenterY
  } = useMeteogramScales({ hourlyData, width, height, margin: MARGIN });

  // 3. Tooltip Logic
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<HourlyDataPoint>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  // 4. Interaction Handler
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = timeScale.invert(x - MARGIN.left);
      const index = bisectDate(hourlyData, x0, 1);
      const d0 = hourlyData[index - 1];
      const d1 = hourlyData[index];
      let d = d0;
      if (d1 && getDate(d1)) {
        d = x0.getTime() - getDate(d0).getTime() > getDate(d1).getTime() - x0.getTime() ? d1 : d0;
      }
      if (d && xMax > 0) {
        showTooltip({
          tooltipData: d,
          tooltipLeft: (timeScale(getDate(d)) ?? 0) + MARGIN.left,
          tooltipTop: tempScale(getTemp(d)) + MARGIN.top,
        });
      }
    },
    [showTooltip, timeScale, hourlyData, tempScale, xMax]
  );

  if (width < 10) return null;

  return (
    <div
        ref={containerRef}
        className="relative touch-pan-y meteogram-container"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => hideTooltip()}
        data-testid="meteogram-chart"
    >
      <svg width={width} height={height} className="overflow-visible">
        {/* Definitions */}
        <ChartDefs
            width={width}
            height={height}
            hourlyData={hourlyData}
            timeScale={timeScale}
            windSpeedScale={windSpeedScale}
        />

        {/* Background Layers */}
        <Group left={MARGIN.left} top={MARGIN.top} className="layer-background">
            <NightCycles
                data={data}
                timeScale={timeScale}
                xMax={xMax}
                height={height}
                chartStart={getDate(hourlyData[0])}
            />
            {/* Current Time Line */}
            <CurrentTimeLine
                timeScale={timeScale}
                height={yMax}
            />
        </Group>

        {/* Grid & Chrome */}
        <Group left={MARGIN.left} top={MARGIN.top} className="layer-chrome">
            <GridSystem timeScale={timeScale} yMax={yMax} />
        </Group>

        {/* Weather Visuals */}
        <Group left={MARGIN.left} top={MARGIN.top} className="layer-visuals">
            <CloudLayer
                hourlyData={hourlyData}
                dailyData={data.daily}
                timeScale={timeScale}
                cloudScale={cloudScale}
                cloudCenterY={cloudCenterY}
                xMax={xMax}
            />

            <PrecipitationLayer
                hourlyData={hourlyData}
                timeScale={timeScale}
                precipScale={precipScale}
                yMax={yMax}
            />

            <TemperatureLayer
                hourlyData={hourlyData}
                timeScale={timeScale}
                tempScale={tempScale}
                yMax={yMax}
                unitSystem={unitSystem}
            />

            <WindLayer
                hourlyData={hourlyData}
                timeScale={timeScale}
                windSpeedScale={windSpeedScale}
            />

            {/* Cursor Overlay */}
            <ChartCursor
                tooltipOpen={tooltipOpen}
                tooltipLeft={tooltipLeft}
                margin={MARGIN}
                yMax={yMax}
            />
        </Group>

         {/* Axis (Rendered last to be on top? Though usually below visuals is fine if transparency exists, but text should be top) */}
         <Group left={MARGIN.left} top={MARGIN.top} className="layer-axis">
            <TimeAxis timeScale={timeScale} yMax={yMax} />
         </Group>

      </svg>

      {/* Current Time Pill (HTML Overlay) */}
      {(() => {
          const now = new Date();
          const nowX = timeScale(now);
          if (nowX === undefined) return null;

          return (
              <div
                className="absolute px-1.5 py-0.5 rounded bg-white/10 backdrop-blur-sm text-[10px] font-semibold text-white pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2 shadow-sm border border-white/5"
                style={{
                    left: MARGIN.left + nowX,
                    top: MARGIN.top + yMax + 19, // Adjusted vertically
                }}
              >
                 <span className="tabular-nums leading-none">{format(now, 'HH:mm')}</span>
              </div>
          );
      })()}

      {/* Tooltip Portal */}
      {tooltipOpen && tooltipData && (
        <TooltipInPortal
            top={tooltipTop}
            left={tooltipLeft}
            style={{ ...defaultStyles, padding: 0, background: 'transparent', boxShadow: 'none', borderRadius: 0, border: 'none' }}
        >
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-3 text-xs w-32">
                <div className="text-white font-bold mb-2 border-b border-white/10 pb-1">
                    {format(parseISO(tooltipData.time), 'HH:mm')}
                </div>

                <div className="space-y-1.5">
                    {/* Temp */}
                    <div className="flex items-center gap-2">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-white font-medium">
                            {formatTemp(tooltipData.temperature_2m, unitSystem)}°
                        </span>
                    </div>

                    {/* Rain */}
                    <div className="flex items-center gap-2">
                        <Droplet className="w-3.5 h-3.5 text-blue-400" />
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-white font-medium">{formatPrecip(tooltipData.precipitation, unitSystem)}</span>
                            <span className="text-white/50 text-[10px]">{getUnitLabel('precip', unitSystem)}</span>
                        </div>
                    </div>

                    {/* Wind */}
                    <div className="flex items-center gap-2">
                        <Wind className="w-3.5 h-3.5 text-red-500" />
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-white font-medium">{formatSpeed(tooltipData.windspeed_10m, unitSystem)}</span>
                            <span className="text-white/50 text-[10px]">{getUnitLabel('speed', unitSystem)}</span>
                        </div>
                    </div>

                    {/* Cloud */}
                    <div className="flex items-center gap-2">
                        <Cloud className="w-3.5 h-3.5 text-white/60" />
                        <span className="text-white font-medium">{tooltipData.cloudcover}%</span>
                    </div>
                </div>
            </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
