
import { Wind, Database } from 'lucide-react';
import { formatTemp, formatSpeed, getUnitLabel, getWindDirection, type UnitSystem } from '../utils/units';
import { getWeatherDescription } from '../utils/weatherCodes';
import type { WeatherData } from '../api/weather';

interface CurrentWeatherProps {
    data: WeatherData;
    unitSystem: UnitSystem;
}

export function CurrentWeather({ data, unitSystem }: CurrentWeatherProps) {

    const current = data.current;

    // Apparent temp / Feels like
    // Find current hour index
    const curIndex = data.hourly.time.findIndex(t => t === current.time);
    const apparentTemp = curIndex !== -1 ? data.hourly.apparent_temperature[curIndex] : current.temperature_2m;

    return (
        <div className="flex flex-col items-start w-full">
            {/* Big Thin Temp with aligned unit */}
            <div className="flex items-start">
                <h1 className="text-[7rem] md:text-[8rem] leading-none font-thin tracking-tighter text-white text-box-trim-cap">
                    {formatTemp(current.temperature_2m, unitSystem)}
                </h1>
                <div className="flex">
                    <span className="text-3xl md:text-4xl font-light text-blue-100/90 text-box-trim-cap">
                        {getUnitLabel('temp', unitSystem)}
                    </span>
                </div>
            </div>

            {/* Feels Like - Increased spacing */}
            <div className={`text-sm font-medium tracking-widest text-blue-200/60 uppercase mt-2 mb-4 ${formatTemp(current.temperature_2m, unitSystem) === formatTemp(apparentTemp, unitSystem) ? 'invisible' : ''}`}>
                Feels Like {formatTemp(apparentTemp, unitSystem)}°
            </div>

            {/* Condition Text - Large, readable */}
            <div className="text-3xl md:text-5xl font-light leading-tight text-white/95 max-w-lg tracking-tight mb-4">
                {getWeatherDescription(current.weather_code)} now.
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-3 text-blue-200/60 text-xs font-semibold tracking-widest uppercase">

                <div className="flex items-center gap-1.5">
                    <Wind className="w-3 h-3 text-blue-200/40" />
                    <span>
                        {formatSpeed(current.wind_speed_10m, unitSystem)}
                        {' '}{getUnitLabel('speed', unitSystem)}{' '}
                        {getWindDirection(current.wind_direction_10m)}
                        {current.wind_gusts_10m && current.wind_gusts_10m > current.wind_speed_10m && (
                            <span className="opacity-60 ml-1">(Gusts {formatSpeed(current.wind_gusts_10m, unitSystem)}
                                {' '}{getUnitLabel('speed', unitSystem)})</span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-blue-200/40" />
                    <span>Open Meteo</span>
                </div>
            </div>
        </div>
    );
}
