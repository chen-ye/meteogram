export type UnitSystem = 'metric' | 'imperial';

export const toFahrenheit = (c: number) => (c * 9) / 5 + 32;
export const toMph = (kmh: number) => kmh * 0.621371;
export const toInches = (mm: number) => mm * 0.0393701;

export const formatTemp = (c: number, system: UnitSystem) => {
  const val = system === 'imperial' ? toFahrenheit(c) : c;
  return Math.round(val);
};

export const formatSpeed = (kmh: number, system: UnitSystem) => {
  const val = system === 'imperial' ? toMph(kmh) : kmh;
  return Math.round(val);
};

export const formatPrecip = (mm: number, system: UnitSystem) => {
  const val = system === 'imperial' ? toInches(mm) : mm;
  // Metric: mm (usually 1 decimal if small). Imperial: inches (2 decimals needed for small amounts)
  return system === 'imperial' ? val.toFixed(2) : val.toString(); // Keep simple for now
};

export const getUnitLabel = (type: 'temp' | 'speed' | 'precip', system: UnitSystem) => {
  switch (type) {
    case 'temp': return system === 'imperial' ? '°F' : '°C';
    case 'speed': return system === 'imperial' ? 'mph' : 'km/h';
    case 'precip': return system === 'imperial' ? 'in' : 'mm';
  }
};

export const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
};
