import React, { useMemo } from 'react';
import { addHours, parseISO, formatDistanceToNow } from 'date-fns';
import { Droplet, Snowflake } from 'lucide-react';
import type { WeatherData } from '../api/weather';
import { getSnowRatio } from '../components/meteogram/utils';

interface NextPrecipIndicatorProps {
  hourly: WeatherData['hourly'];
}

type PrecipStatus =
  | { status: 'starts'; type: 'rain' | 'snow'; time: string }
  | { status: 'ends'; type: 'rain' | 'snow'; time: string }
  | { status: 'changes'; from: 'rain' | 'snow'; to: 'rain' | 'snow'; time: string };

const getNextPrecip = (hourly: WeatherData['hourly']): PrecipStatus | null => {
  const now = new Date();
  const limit = addHours(now, 24);
  const nextHourIndex = hourly.time.findIndex(t => new Date(t) > now);

  if (nextHourIndex === -1) return null;

  const getType = (i: number): 'rain' | 'snow' | 'none' => {
       if (hourly.precipitation[i] <= 0) return 'none';
       const d = {
           precipitation: hourly.precipitation[i],
           rain: hourly.rain?.[i] || 0,
           showers: hourly.showers?.[i] || 0,
           snowfall: hourly.snowfall?.[i] || 0,
       };
       return getSnowRatio(d) > 0.5 ? 'snow' : 'rain';
  };

  const currentType = getType(nextHourIndex);

  // If currently raining/snowing (at next hour), look for end or change
  if (currentType !== 'none') {
      for (let i = nextHourIndex + 1; i < hourly.precipitation.length; i++) {
          if (new Date(hourly.time[i]) > limit) break;

          const nextType = getType(i);
          if (nextType === 'none') {
              return { status: 'ends', type: currentType, time: hourly.time[i] };
          }
          if (nextType !== currentType) {
              return { status: 'changes', from: currentType, to: nextType, time: hourly.time[i] };
          }
      }
  } else {
      // Not raining, look for start
      for (let i = nextHourIndex; i < hourly.precipitation.length; i++) {
          if (new Date(hourly.time[i]) > limit) break;

          const type = getType(i);
          if (type !== 'none') {
              return { status: 'starts', type, time: hourly.time[i] };
          }
      }
  }

  return null;
};

export const NextPrecipIndicator: React.FC<NextPrecipIndicatorProps> = ({ hourly }) => {
  const nextPrecip = useMemo(() => getNextPrecip(hourly), [hourly]);

  if (!nextPrecip) return null;

  const isSnowRelated =
      (nextPrecip.status === 'starts' && nextPrecip.type === 'snow') ||
      (nextPrecip.status === 'ends' && nextPrecip.type === 'snow') ||
      (nextPrecip.status === 'changes' && nextPrecip.to === 'snow');

  return (
    <div className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase mt-3 ${
        isSnowRelated ? 'text-white' : 'text-cyan-400'
    }`}>
       {/* Icon Selection */}
       {(() => {
           if (nextPrecip.status === 'changes') {
                return nextPrecip.to === 'snow' ? <Snowflake className="w-3 h-3" /> : <Droplet className="w-3 h-3" />;
           }
           return nextPrecip.type === 'snow' ? <Snowflake className="w-3 h-3" /> : <Droplet className="w-3 h-3" />;
       })()}

       {/* Text Generation */}
       <span>
         {(() => {
             const relativeTime = formatDistanceToNow(parseISO(nextPrecip.time), { addSuffix: true });
             if (nextPrecip.status === 'ends') {
                 return `${nextPrecip.type === 'snow' ? 'Snow' : 'Rain'} ending ${relativeTime}`;
             }
             if (nextPrecip.status === 'changes') {
                  return `${nextPrecip.from === 'snow' ? 'Snow' : 'Rain'} \u2192 ${nextPrecip.to === 'snow' ? 'Snow' : 'Rain'} ${relativeTime}`;
             }
             // Starts
             return `${nextPrecip.type === 'snow' ? 'Snow' : 'Rain'} ${relativeTime}`;
         })()}
       </span>
    </div>
  );
};
