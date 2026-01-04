import React, { useMemo, useCallback } from 'react';
import { Group } from '@visx/group';
import { AreaClosed, Area, Bar, LinePath, Line } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { LinearGradient } from '@visx/gradient';
import { AxisBottom } from '@visx/axis';
import { curveMonotoneX } from '@visx/curve';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import type { WeatherData } from '../api/weather';
import { parseISO, format, isBefore } from 'date-fns';
import { bisector } from 'd3-array';
import { formatPrecip, getUnitLabel, type UnitSystem, formatTemp, formatSpeed } from '../utils/units';

export interface MeteogramProps {
  data: WeatherData;
  width: number;
  height: number;
  unitSystem: UnitSystem;
}

interface HourlyDataPoint {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  dewpoint_2m: number;
  precipitation: number;
  cloudcover: number;
  windspeed_10m: number;
  winddirection_10m: number;
}

// Accessors (generic)
const getDate = (d: { time: string }) => parseISO(d.time);

// Bisector
const bisectDate = bisector<{ time: string }, Date>((d) => parseISO(d.time)).left;

// Accessors
const getTemp = (d: HourlyDataPoint) => d.temperature_2m;
const getDewPoint = (d: HourlyDataPoint) => d.dewpoint_2m;
const getPrecip = (d: HourlyDataPoint) => d.precipitation;
const getCloud = (d: HourlyDataPoint) => d.cloudcover;
const getWindSpeed = (d: HourlyDataPoint) => d.windspeed_10m;

const margin = { top: 60, right: 0, bottom: 40, left: 0 }; // Full width

export function Meteogram({ data, width, height, unitSystem }: MeteogramProps) {
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);

  // Tooltip
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<HourlyDataPoint>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
  });

  // Data (48h) - ALWAYS METRIC for consistent geometry
  const hourlyData = useMemo(() => {
    return data.hourly.time.slice(0, 48).map((t, i) => ({
      time: t,
      temperature_2m: data.hourly.temperature_2m[i],
      apparent_temperature: data.hourly.apparent_temperature?.[i] ?? data.hourly.temperature_2m[i],
      dewpoint_2m: data.hourly.dewpoint_2m?.[i] ?? data.hourly.temperature_2m[i] - 5,
      precipitation: data.hourly.precipitation[i],
      cloudcover: data.hourly.cloudcover[i],
      windspeed_10m: data.hourly.windspeed_10m[i],
      winddirection_10m: data.hourly.winddirection_10m[i],
    }));
  }, [data]);


  // Scales (Metric domains)
  const timeScale = useMemo(
    () =>
      scaleTime({
        range: [0, xMax],
        domain: [getDate(hourlyData[0]).getTime(), getDate(hourlyData[hourlyData.length - 1]).getTime()],
      }),
    [xMax, hourlyData]
  );

  const tempScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, 0],
        domain: [
          Math.min(...hourlyData.map((d) => Math.min(d.temperature_2m, d.dewpoint_2m))) - 5,
          Math.max(...hourlyData.map(d => d.temperature_2m)) + 5,
        ],
        nice: true,
      }),
    [yMax, hourlyData]
  );

  const precipScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, yMax * 0.7],
        // Ensure strictly positive domain max to avoid NaN if all 0
        domain: [0, Math.max(...hourlyData.map(getPrecip), 5)],
      }),
    [yMax, hourlyData] // getPrecip is constant ref, but included for completeness if needed (though it's derived from component scope correctly)
  );

  const cloudCenterY = yMax * 0.12;
  const cloudScale = useMemo(
    () => scaleLinear({
        range: [0, 15], // Narrower range
        domain: [0, 100],
    }),
    []
  );

  const windSpeedScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, yMax * 0.55], // Bottom 45%
        // Min domain 20km/h
        domain: [0, Math.max(20, ...hourlyData.map(getWindSpeed))],
      }),
    [yMax, hourlyData]
  );


  // Night Shading Logic
  const nightRects = useMemo(() => {
    const rects: React.ReactElement[] = [];
    if (!data.daily || !data.daily.sunrise || !data.daily.sunset) return rects;

    data.daily.time.forEach((_, i) => {
        const sunset = parseISO(data.daily.sunset[i]);
        const nextSunriseStr = data.daily.sunrise[i+1];
        const nextSunrise = nextSunriseStr ? parseISO(nextSunriseStr) : null;

        // 1. Draw rect from Sunset to next day Sunrise
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
                     />
                 )
             }
        }

        // Check "night before first sunrise" (first day only)
        if (i === 0) {
             const sunrise = parseISO(data.daily.sunrise[0]);
             const chartStart = getDate(hourlyData[0]);
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
                        />
                    )
                 }
             }
        }
    });

    return rects;
  }, [data.daily, timeScale, xMax, height, hourlyData]);

    // Pre-calculate jitter to avoid side-effects in render
    const dropletJitter = useMemo(() => {
        return hourlyData.map((d) => {
             const numDroplets = Math.min(Math.ceil(d.precipitation * 2), 5);
             return Array.from({length: numDroplets}).map(() => Math.random() * 6 - 3);
        });
    }, [hourlyData]);


  // Interaction
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = timeScale.invert(x - margin.left);
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
          tooltipLeft: (timeScale(getDate(d)) ?? 0) + margin.left,
          tooltipTop: tempScale(getTemp(d)) + margin.top,
        });
      }
    },
    [showTooltip, timeScale, hourlyData, tempScale, xMax] // Added getTemp
  );

  if (width < 10) return null;

  return (
    <div ref={containerRef} className="relative touch-none" onPointerMove={handlePointerMove} onPointerLeave={() => hideTooltip()}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Gradients & Masks */}
        <defs>
            <LinearGradient id="temp-fill-gradient" from="#fbbf24" to="#3b82f6" fromOpacity={0.2} toOpacity={0.05} />
            <LinearGradient id="temp-stroke-gradient" from="#fbbf24" to="#3b82f6" />
            <LinearGradient id="dew-stroke-gradient" from="#22d3ee" to="#22d3ee" />
            <LinearGradient id="precip-gradient" from="#3b82f6" to="#3b82f6" fromOpacity={0.8} toOpacity={0.1} />

            <mask id="wind-line-mask">
                <rect x={0} y={0} width={width} height={height} fill="white" />
                {hourlyData.map((d, i) => {
                     if (i % 2 !== 0) return null;
                     const x = timeScale(getDate(d)) ?? 0;
                     const y = windSpeedScale(getWindSpeed(d)) ?? 0;
                     return <circle key={`mask-${i}`} cx={x} cy={y} r={8} fill="black" />;
                })}
            </mask>
        </defs>

        {/* Night Shading Background Layer */}
        <Group left={margin.left} top={margin.top}>
            {nightRects}
        </Group>

        {/* Grid & Axis */}
        <Group left={margin.left} top={margin.top}>
             {/* Draw Grid Lines every 6 hours? Or standard time ticks? */}
             {timeScale.ticks(8).map((t) => {
                 const isMidnight = t.getHours() === 0;
                 return (
                     <g key={`grid-${t.getTime()}`}>
                        <Line
                            from={{x: timeScale(t), y: 0}}
                            to={{x: timeScale(t), y: yMax}}
                            stroke={isMidnight ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}
                            strokeWidth={isMidnight ? 1.5 : 1}
                            strokeDasharray={isMidnight ? undefined : "4 4"}
                        />
                     </g>
                 )
             })}

             {/* Axis labels manual placement */}
             <AxisBottom
                scale={timeScale}
                top={yMax}
                stroke="transparent"
                tickStroke="transparent"
                numTicks={8}
                tickFormat={(val) => {
                    const d = val as Date;
                    if (d.getHours() === 0) return format(d, 'EEE').toUpperCase();
                    return d.getHours().toString();
                }}
                 tickLabelProps={(val) => {
                     const isDay = (val as Date).getHours() === 0;
                     return {
                        fill: isDay ? '#ffffff' : 'rgba(255,255,255,0.5)', // Alpha white
                        fontSize: isDay ? 12 : 11,
                        fontWeight: isDay ? 700 : 400,
                        textAnchor: 'start', // Align left of the line
                        dx: 4,
                        dy: 4
                     }
                 }}
             />

             {/* Cloud Cover - Symmetrical Streamgraph Style */}
             <Area
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y0={d => cloudCenterY - (cloudScale(getCloud(d)) ?? 0)}
                y1={d => cloudCenterY + (cloudScale(getCloud(d)) ?? 0)}
                fill="#ffffff"
                fillOpacity={0.15} // Alpha fill
                stroke="rgba(255,255,255,0.4)" // Outline
                strokeWidth={1}
                curve={curveMonotoneX}
             />


             {/* Precipitation Bars */}
             {hourlyData.map(d => {
                 const barH = yMax - (precipScale(getPrecip(d)) ?? yMax);
                 if (barH <= 0) return null;
                 return (
                     <Bar
                        key={`p-${d.time}`}
                        x={(timeScale(getDate(d)) ?? 0) - 3}
                        y={yMax - barH}
                        width={6}
                        height={barH}
                        fill="url(#precip-gradient)"
                        rx={2}
                     />
                 )
             })}


             {/* Dew Point Line */}
             <LinePath
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y={d => tempScale(getDewPoint(d)) ?? 0}
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="2 4" // Dotted
                strokeOpacity={0.8}
                curve={curveMonotoneX}
             />

             {/* Temperature Area Fill */}
             <AreaClosed
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y0={yMax}
                y1={d => tempScale(getTemp(d)) ?? 0}
                yScale={tempScale}
                stroke="transparent"
                fill="url(#temp-fill-gradient)"
                curve={curveMonotoneX}
             />

             {/* Main Temp Line */}
             <LinePath
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y={d => tempScale(getTemp(d)) ?? 0}
                stroke="url(#temp-stroke-gradient)"
                strokeWidth={3}
                curve={curveMonotoneX}
             />

             {/* Temp Labels on Line (Max/Min Peaks for each day) */}
             {(() => {
                // Find extrema for each day
                const days = new Set(hourlyData.map(d => getDate(d).getDate()));
                const labels: { x: number, y: number, text: string, type: 'min' | 'max' }[] = [];

                days.forEach(day => {
                   const dayData = hourlyData.filter(d => getDate(d).getDate() === day);
                   if (dayData.length === 0) return;

                   // Min
                   const minPoint = dayData.reduce((prev, curr) => getTemp(curr) < getTemp(prev) ? curr : prev);
                   // Max
                   const maxPoint = dayData.reduce((prev, curr) => getTemp(curr) > getTemp(prev) ? curr : prev);

                   // Only add if not too close to edges of dataset (optional)
                   labels.push({
                      x: timeScale(getDate(maxPoint)) ?? 0,
                      y: tempScale(getTemp(maxPoint)) ?? 0,
                      text: `${formatTemp(getTemp(maxPoint), unitSystem)}°`,
                      type: 'max'
                   });
                   labels.push({
                      x: timeScale(getDate(minPoint)) ?? 0,
                      y: tempScale(getTemp(minPoint)) ?? 0,
                      text: `${formatTemp(getTemp(minPoint), unitSystem)}°`,
                      type: 'min'
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
                   >
                      {l.text}
                   </text>
                ));
             })()}


             {/* Rain Droplets under Cloud - NEW */}
             {hourlyData.map((d, index) => { // Use index for jitter lookup
                 if (d.precipitation <= 0) return null;
                 const x = timeScale(getDate(d)) ?? 0;
                 const cloudBottomY = cloudCenterY + (cloudScale(getCloud(d)) ?? 0);

                 // Render droplets based on intensity
                 const numDroplets = Math.min(Math.ceil(d.precipitation * 2), 5); // Cap at 5 droplets
                 // const droplets = []; // REPLACED WITH JITTER ARRAY

                 return dropletJitter[index].slice(0, numDroplets).map((jitter, j) => (
                    <circle
                        key={`drop-${d.time}-${j}`}
                        cx={x + jitter} // Usage of pre-calc jitter
                        cy={cloudBottomY + 5 + (j * 4)} // Stack vertically
                        r={1}
                        fill="#60a5fa" // Light blue
                        opacity={0.6}
                    />
                 ));
             })}


             {/* Wind Speed Line - MASKED Connecting Line (Thicker) */}
             <LinePath
                data={hourlyData}
                x={d => timeScale(getDate(d)) ?? 0}
                y={d => windSpeedScale(getWindSpeed(d)) ?? 0}
                stroke="#ef4444"
                strokeWidth={2} // Thicker [NEW]
                strokeOpacity={0.8}
                curve={curveMonotoneX}
                mask="url(#wind-line-mask)" // Apply Mask [NEW]
             />

             {/* Wind Stream Arrows - Positioned on the line WITHOUT knockout circle */}
             {hourlyData.map((d, i) => {
                 if (i % 2 !== 0) return null; // Every 2nd hour
                 const x = timeScale(getDate(d)) ?? 0;
                 const y = windSpeedScale(getWindSpeed(d)) ?? 0;

                 return (
                     <Group key={`w-${d.time}`} top={y} left={x}>
                         {/* Rotate arrow to point with wind direction */}
                         <g transform={`rotate(${d.winddirection_10m + 180})`}>
                              <path d="M0,4 L3,-4 L0,-2 L-3,-4 Z" fill="#ef4444" />
                         </g>
                     </Group>
                 )
             })}

             {/* Cursor Line */}
             {tooltipOpen && (
                 <Line
                    from={{x: (tooltipLeft ?? 0) - margin.left, y: 0}}
                    to={{x: (tooltipLeft ?? 0) - margin.left, y: yMax}}
                    stroke="white"
                    strokeWidth={1}
                    strokeDasharray="4 2"
                    pointerEvents="none"
                 />
             )}
        </Group>

      </svg>
      {/* Tooltip */}
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
