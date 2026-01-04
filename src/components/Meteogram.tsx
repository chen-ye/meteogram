import React, { useCallback } from 'react';
import { Group } from '@visx/group';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { format, parseISO } from 'date-fns';

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
        className="relative touch-none meteogram-container"
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

      {/* Tooltip Portal */}
      {tooltipOpen && tooltipData && (
        <TooltipInPortal
            top={tooltipTop}
            left={tooltipLeft}
            style={{...defaultStyles, backgroundColor: '#0f172a', color: 'white', zIndex: 9999, border: '1px solid rgba(255,255,255,0.2)'}}
        >
            <div className="text-xs">
                <div className="font-bold">{format(parseISO(tooltipData.time), 'HH:mm')}</div>
                <div>Temp: {formatTemp(tooltipData.temperature_2m, unitSystem)}°</div>
                <div>Rain: {formatPrecip(tooltipData.precipitation, unitSystem)}{getUnitLabel('precip', unitSystem)}</div>
                <div>Wind: {formatSpeed(tooltipData.windspeed_10m, unitSystem)} {getUnitLabel('speed', unitSystem)}</div>
                <div>Cloud: {tooltipData.cloudcover}%</div>
            </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
