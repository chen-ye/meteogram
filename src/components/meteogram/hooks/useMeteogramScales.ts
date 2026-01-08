import { useMemo } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import type { HourlyDataPoint } from '../types';
import { getDate, getPrecip, getWindSpeed } from '../utils';

interface UseMeteogramScalesProps {
  hourlyData: HourlyDataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export function useMeteogramScales({ hourlyData, width, height, margin }: UseMeteogramScalesProps) {
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);

  const timeScale = useMemo(
    () =>
      scaleTime({
        range: [0, xMax],
        domain: [
          getDate(hourlyData[0]).getTime(),
          getDate(hourlyData[hourlyData.length - 1]).getTime(),
        ],
      }),
    [xMax, hourlyData],
  );

  const tempScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, 0],
        domain: [
          Math.min(...hourlyData.map((d) => Math.min(d.temperature_2m, d.dewpoint_2m))) - 5,
          Math.max(...hourlyData.map((d) => d.temperature_2m)) + 5,
        ],
        nice: true,
      }),
    [yMax, hourlyData],
  );

  const precipScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, yMax * 0.7],
        // Ensure strictly positive domain max to avoid NaN if all 0
        domain: [0, Math.max(...hourlyData.map(getPrecip), 5)],
      }),
    [yMax, hourlyData],
  );

  const cloudCenterY = yMax * 0.12;
  const cloudScale = useMemo(
    () =>
      scaleLinear({
        range: [0, 15], // Narrower range
        domain: [0, 100],
      }),
    [],
  );

  const windSpeedScale = useMemo(
    () =>
      scaleLinear({
        range: [yMax, yMax * 0.55], // Bottom 45%
        // Min domain 20km/h
        domain: [0, Math.max(20, ...hourlyData.map(getWindSpeed))],
      }),
    [yMax, hourlyData],
  );

  return {
    timeScale,
    tempScale,
    precipScale,
    cloudScale,
    windSpeedScale,
    xMax,
    yMax,
    cloudCenterY,
  };
}
