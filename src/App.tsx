import { useState, useEffect } from 'react';
import { useLocation } from './hooks/useLocation';
import { useWeather, type WeatherData } from './hooks/useWeather';
import { useGeocoding } from './hooks/useGeocoding';
import { LocationSearch } from './components/LocationSearch';
import { Meteogram } from './components/Meteogram';
import { ParentSize } from '@visx/responsive';
import { getWeatherDescription } from './utils/weatherCodes';
import { Droplet, MapPin, Clock, Database, Wind } from 'lucide-react';
import { parseISO, addHours, formatDistanceToNow } from 'date-fns';
import { formatTemp, formatSpeed, getUnitLabel, type UnitSystem } from './utils/units';

// Helper to find next rain (within 24 hours)
const getNextRain = (hourly: WeatherData['hourly']) => {
  const now = new Date();
  const limit = addHours(now, 24);
  const index = hourly.time.findIndex(t => new Date(t) > now);
  if (index === -1) return null;

  for (let i = index; i < hourly.precipitation.length; i++) {
    const time = new Date(hourly.time[i]);
    if (time > limit) break;

    if (hourly.precipitation[i] > 0) {
      return { time: hourly.time[i], amount: hourly.precipitation[i] };
    }
  }
  return null;
};

// Helper for WMO description (if needed locally, or re-export from utils)
const getWmoDescription = (code: number) => getWeatherDescription(code);


function App() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('units');
    return (u === 'metric' || u === 'imperial') ? u : 'metric';
  });

  // Manual Location State (from URL)
  const [manualLocation, setManualLocation] = useState<{latitude: number; longitude: number} | null>(() => {
      const params = new URLSearchParams(window.location.search);
      const lat = params.get('lat');
      const lon = params.get('lon');
      if (lat && lon) {
          return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
      }
      return null;
  });

  const { location: autoLocation, error: locError, loading: locLoading } = useLocation();

  // Determine active location: Manual overrides Auto
  const activeLocation = manualLocation || autoLocation;
  const isLocating = !manualLocation && locLoading;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('units') !== unitSystem) {
      params.set('units', unitSystem);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [unitSystem]);

  // Persist Location changes
  const updateLocationUrl = (lat?: number, lon?: number) => {
      const params = new URLSearchParams(window.location.search);
      if (lat && lon) {
          params.set('lat', lat.toString());
          params.set('lon', lon.toString());
          setManualLocation({ latitude: lat, longitude: lon });
      } else {
          params.delete('lat');
          params.delete('lon');
          setManualLocation(null);
      }
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({}, '', newUrl);
  };

  const { weather, isLoading, isError } = useWeather(activeLocation?.latitude, activeLocation?.longitude);
  const { locationName } = useGeocoding(activeLocation?.latitude, activeLocation?.longitude);



  if (!activeLocation && isLocating) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white p-4 text-center font-sans">
        {locError ? (
           <div className="text-red-400">
             <p className="text-xl mb-2">Location Error</p>
             <p>{locError}</p>
             <p className="text-sm text-slate-400 mt-4">Please enable location services.</p>
           </div>
        ) : (
          <div className="animate-pulse flex flex-col items-center">
            <span className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-white animate-spin mb-4"></span>
            <p className="text-xl font-light tracking-wide">Locating you...</p>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/50"></div>
      </div>
    );
  }

  if (isError || !weather || !activeLocation) {
     return (
        <div className="flex h-screen items-center justify-center bg-slate-900 text-white flex-col gap-4">
           <p className="text-red-400 font-light">Failed to load weather data.</p>
           <button onClick={() => updateLocationUrl()} className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-500 transition-colors">
             Try Auto-Location
           </button>
        </div>
     );
  }

  const current = weather.current_weather;
  const nextRain = getNextRain(weather.hourly);

  // Apparent temp / Feels like
  // Find current hour index
  const curIndex = weather.hourly.time.findIndex(t => t === current.time);
  const apparentTemp = curIndex !== -1 ? weather.hourly.apparent_temperature[curIndex] : current.temperature;


  return (
    <div className="min-h-[100svh] bg-[#004e92] text-white flex flex-col font-sans selection:bg-blue-500/30">
       {/* Main Gradient Background */}
       <div className="fixed inset-0 bg-gradient-to-b from-[#004e92] via-[#00387a] to-[#002955] -z-10" />

       <header className="p-8 md:p-12 md:pb-0 pb-0 flex flex-col items-start text-left bg-transparent z-20 shrink-0">

          <div className="flex flex-col items-start animate-in fade-in slide-in-from-top-4 duration-700 w-full relative">

             {/* Top Right Controls Container */}
             <div className="w-full relative flex items-center justify-between gap-3 mb-6 md:absolute md:top-0 md:right-0 md:w-auto md:justify-end md:mb-0">

                 {/* Location Search & Locate Me */}
                 <LocationSearch
                    onLocationSelect={(lat, lon) => updateLocationUrl(lat, lon)}
                    onLocateMe={() => updateLocationUrl()}
                    isLocating={isLocating}
                 />

                 {/* Unit Switcher */}
                 <div
                    onClick={() => setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric')}
                    className="flex items-center p-1 bg-blue-950/20 backdrop-blur-sm rounded-lg border border-white/5 isolate cursor-pointer group h-8 relative w-24"
                 >
                    {/* Sliding Background */}
                    <div
                        className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white/10 rounded shadow-sm transition-transform duration-300 ease-out ${
                            unitSystem === 'imperial' ? 'translate-x-full' : 'translate-x-0'
                        }`}
                    />

                    <div className={`relative z-10 w-1/2 flex justify-center items-center text-xs font-bold transition-colors duration-300 select-none ${
                            unitSystem === 'metric' ? 'text-white' : 'text-blue-200/40 group-hover:text-blue-200/60'
                        }`}>
                        °C
                    </div>

                    <div className={`relative z-10 w-1/2 flex justify-center items-center text-xs font-bold transition-colors duration-300 select-none ${
                            unitSystem === 'imperial' ? 'text-white' : 'text-blue-200/40 group-hover:text-blue-200/60'
                        }`}>
                        °F
                    </div>
                 </div>
             </div>

             {/* Big Thin Temp with aligned unit */}
             <div className="flex items-start">
                 <h1 className="text-[7rem] md:text-[8rem] leading-none font-thin tracking-tighter text-white text-box-trim-cap">
                    {formatTemp(current.temperature, unitSystem)}
                 </h1>
                 <div className="flex">
                    <span className="text-3xl md:text-4xl font-light text-blue-100/90 text-box-trim-cap">
                        {getUnitLabel('temp', unitSystem)}
                    </span>
                 </div>
             </div>

             {/* Feels Like - Increased spacing */}
             <div className="text-sm font-medium tracking-widest text-blue-200/60 uppercase mt-2 mb-6">
                FEELS LIKE {formatTemp(apparentTemp, unitSystem)}°
             </div>

             {/* Condition Text - Large, readable */}
             <div className="text-3xl md:text-5xl font-light leading-tight text-white/95 max-w-lg tracking-tight mb-4">
                {getWmoDescription(current.weathercode)} now.
             </div>

             {/* Meta data row */}
             <div className="flex items-center gap-3 text-blue-200/60 text-xs font-semibold tracking-widest uppercase">
                 <div className="flex items-center gap-1.5">
                     <MapPin className="w-3 h-3 text-blue-200/40" />
                     <span>{manualLocation ? (locationName ? locationName.toUpperCase() : 'COORDINATES') : (locationName ? locationName.toUpperCase() : 'LOCATING...')}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-200/40" />
                    <span>right now</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                     <Wind className="w-3 h-3 text-blue-200/40" />
                     <span>{formatSpeed(current.windspeed, unitSystem)} {getUnitLabel('speed', unitSystem)}</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-blue-200/40" />
                    <span>Open Meteo</span>
                 </div>
             </div>

             {/* Rain at specific time (Dynamic) - Condition Render */}
             {nextRain && (
               <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider uppercase mt-3">
                  <Droplet className="w-3 h-3" />
                  <span>Rain {formatDistanceToNow(parseISO(nextRain.time), { addSuffix: true })}</span>
               </div>
             )}

          </div>
       </header>

       <main className="flex-1 w-full relative mt-auto flex flex-col">
          <div className="flex-1 w-full min-h-[350px] relative flex flex-col">
             <ParentSize className="w-full h-full flex-1">
               {({ width, height }: { width: number; height: number }) => (
                 <Meteogram data={weather} width={width} height={height} unitSystem={unitSystem} />
               )}
             </ParentSize>
          </div>
       </main>
    </div>
  );
}

export default App;
