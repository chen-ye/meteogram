import { fetchWeatherApi } from 'openmeteo';

export interface WeatherData {
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    rain: number[];
    showers: number[];
    snowfall: number[];
    weathercode: number[];
    cloudcover: number[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    apparent_temperature: number[];
    dewpoint_2m: number[];
    pressure_msl: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
  current: {
    temperature_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    time: string;
    wind_gusts_10m?: number;
  };
  utc_offset_seconds: number;
}

const URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = {
    latitude: lat,
    longitude: lon,
    hourly: [
      "temperature_2m",
      "precipitation",
      "rain",
      "showers",
      "snowfall",
      "weathercode",
      "cloudcover",
      "windspeed_10m",
      "winddirection_10m",
      "apparent_temperature",
      "dewpoint_2m",
      "pressure_msl"
    ],
    daily: ["sunrise", "sunset"],
    current: [
      "temperature_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code",
      "wind_gusts_10m"
    ],
    timezone: "auto",
    forecast_days: 5,
  };

  const responses = await fetchWeatherApi(URL, params);
  const response = responses[0];

  const utcOffsetSeconds = response.utcOffsetSeconds();
  const current = response.current()!;
  const hourly = response.hourly()!;
  const daily = response.daily()!;

  const weatherData: WeatherData = {
    hourly: {
      time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
        (t) => new Date((t + utcOffsetSeconds) * 1000).toISOString()
      ),
      temperature_2m: Array.from(hourly.variables(0)!.valuesArray()!),
      precipitation: Array.from(hourly.variables(1)!.valuesArray()!),
      rain: Array.from(hourly.variables(2)!.valuesArray()!),
      showers: Array.from(hourly.variables(3)!.valuesArray()!),
      snowfall: Array.from(hourly.variables(4)!.valuesArray()!),
      weathercode: Array.from(hourly.variables(5)!.valuesArray()!),
      cloudcover: Array.from(hourly.variables(6)!.valuesArray()!),
      windspeed_10m: Array.from(hourly.variables(7)!.valuesArray()!),
      winddirection_10m: Array.from(hourly.variables(8)!.valuesArray()!),
      apparent_temperature: Array.from(hourly.variables(9)!.valuesArray()!),
      dewpoint_2m: Array.from(hourly.variables(10)!.valuesArray()!),
      pressure_msl: Array.from(hourly.variables(11)!.valuesArray()!),
    },
    daily: {
      time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
        (t) => new Date((t + utcOffsetSeconds) * 1000).toISOString()
      ),
      sunrise: extractInt64Array(daily.variables(0)!).map((t) =>
        new Date((Number(t) + utcOffsetSeconds) * 1000).toISOString()
      ),
      sunset: extractInt64Array(daily.variables(1)!).map((t) =>
        new Date((Number(t) + utcOffsetSeconds) * 1000).toISOString()
      ),
    },
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000).toISOString(),
      temperature_2m: current.variables(0)!.value(),
      wind_speed_10m: current.variables(1)!.value(),
      wind_direction_10m: current.variables(2)!.value(),
      weather_code: current.variables(3)!.value(),
      wind_gusts_10m: current.variables(4)!.value(),
    },
    utc_offset_seconds: utcOffsetSeconds,
  };

  return weatherData;
}

// Helper function to form time ranges
const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

// Helper function to extract Int64 array from VariableWithValues
// Using a local interface to avoid deep imports while maintaining type safety
interface VariableWithInt64 {
  valuesInt64Length(): number;
  valuesInt64(index: number): bigint | null;
}

const extractInt64Array = (variable: VariableWithInt64): bigint[] => {
  const length = variable.valuesInt64Length();
  const arr: bigint[] = [];
  for (let i = 0; i < length; i++) {
    arr.push(variable.valuesInt64(i)!);
  }
  return arr;
};
