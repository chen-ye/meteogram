import zlib from 'node:zlib';
import { promisify } from 'node:util';
const gzip = promisify(zlib.gzip);

const URL = 'https://api.open-meteo.com/v1/forecast';
const lat = 52.52;
const lon = 13.41;

const params = {
  latitude: lat,
  longitude: lon,
  hourly: [
    'temperature_2m',
    'precipitation',
    'rain',
    'showers',
    'snowfall',
    'weathercode',
    'cloudcover',
    'windspeed_10m',
    'winddirection_10m',
    'apparent_temperature',
    'dewpoint_2m',
    'pressure_msl',
  ],
  daily: ['sunrise', 'sunset'],
  current: [
    'temperature_2m',
    'wind_speed_10m',
    'wind_direction_10m',
    'weather_code',
    'wind_gusts_10m',
  ],
  timezone: 'auto',
  forecast_days: 5,
};

// Helper to construct query string
const buildQuery = (params) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      searchParams.append(key, value.join(','));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
};

async function compare() {
  // 1. Fetch JSON (default)
  const jsonQuery = buildQuery(params);
  const jsonUrl = `${URL}?${jsonQuery}`;
  console.log(`Fetching JSON from: ${jsonUrl}`);
  const jsonRes = await fetch(jsonUrl);
  const jsonBlob = await jsonRes.blob();
  const jsonBuffer = Buffer.from(await jsonBlob.arrayBuffer());
  const jsonSize = jsonBuffer.length;
  const jsonGzip = (await gzip(jsonBuffer)).length;

  // 2. Fetch FlatBuffers
  const fbParams = { ...params, format: 'flatbuffers' };
  const fbQuery = buildQuery(fbParams);
  const fbUrl = `${URL}?${fbQuery}`;
  console.log(`Fetching FlatBuffers from: ${fbUrl}`);
  const fbRes = await fetch(fbUrl);
  const fbBlob = await fbRes.blob();
  const fbBuffer = Buffer.from(await fbBlob.arrayBuffer());
  const fbSize = fbBuffer.length;
  const fbGzip = (await gzip(fbBuffer)).length;

  console.log('\n--- Results ---');
  console.log(`JSON Size: ${jsonSize} bytes (Gzipped: ${jsonGzip} bytes)`);
  console.log(`FlatBuffers Size: ${fbSize} bytes (Gzipped: ${fbGzip} bytes)`);

  const rawReduction = (((jsonSize - fbSize) / jsonSize) * 100).toFixed(2);
  const gzipReduction = (((jsonGzip - fbGzip) / jsonGzip) * 100).toFixed(2);

  console.log(`Raw Reduction: ${rawReduction}%`);
  console.log(`Gzip Reduction: ${gzipReduction}%`);
}

compare().catch((err) => console.error(err));
