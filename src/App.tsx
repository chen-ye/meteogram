import { useState, useEffect, useRef } from 'react';
import { useLocation } from './hooks/useLocation';
import { useWeather } from './hooks/useWeather';
import { useGeocoding } from './hooks/useGeocoding';
import { LocationSearch } from './components/LocationSearch';
import { Meteogram } from './components/Meteogram';
import { ParentSize } from '@visx/responsive';
import { inferUnitSystem, type UnitSystem } from './utils/units';
import { NextPrecipIndicator } from './components/NextPrecipIndicator';
import { UnitSwitcher } from './components/UnitSwitcher';
import { CurrentWeather } from './components/CurrentWeather';
import { FullScreenMessage } from './components/FullScreenMessage';



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

  const toggleUnitSystem = () => {
    setUnitSystem(prev => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      const params = new URLSearchParams(window.location.search);
      params.set('units', next);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
      return next;
    });
  };

  const { weather, isLoading, isError } = useWeather(activeLocation?.latitude, activeLocation?.longitude);
  const { locationName, countryCode } = useGeocoding(activeLocation?.latitude, activeLocation?.longitude);

  // Track if units were explicitly provided in URL on mount
  const hasInitialUnits = useRef(new URLSearchParams(window.location.search).has('units'));
  const hasInferred = useRef(false);

  useEffect(() => {
     // If units were NOT explicitly set in URL on mount, infer from country
     // Only do this once to allow user to manually override later
     if (!hasInitialUnits.current && countryCode && !hasInferred.current) {
        const inferred = inferUnitSystem(countryCode);
        if (inferred !== unitSystem) {
            setUnitSystem(inferred);
        }
        hasInferred.current = true;
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);


  if (!activeLocation && isLocating) {
    return (
      <FullScreenMessage>
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
      </FullScreenMessage>
    );
  }

  if (isLoading) {
    return (
      <FullScreenMessage>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white/50"></div>
      </FullScreenMessage>
    );
  }

  if (isError || !weather || !activeLocation) {
     return (
        <FullScreenMessage>
           <div className="flex flex-col gap-4 items-center">
              <p className="text-red-400 font-light">Failed to load weather data.</p>
              <button onClick={() => updateLocationUrl()} className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-500 transition-colors">
                Try Auto-Location
              </button>
           </div>
        </FullScreenMessage>
     );
  }



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
                    currentLocationName={manualLocation ? (locationName ? locationName.toUpperCase() : 'COORDINATES') : (locationName ? locationName.toUpperCase() : 'LOCATING...')}
                 />

                 {/* Unit Switcher */}
                 <UnitSwitcher unitSystem={unitSystem} onToggle={toggleUnitSystem} />
             </div>

             {/* Current Weather Display */}
             <CurrentWeather data={weather} unitSystem={unitSystem} />

             {/* Rain/Snow at specific time (Dynamic) - Condition Render */}

             {/* Rain/Snow at specific time (Dynamic) - Condition Render */}
             <NextPrecipIndicator hourly={weather.hourly} />

          </div>
       </header>

       <main className="flex-1 w-full relative mt-auto flex flex-col min-h-0">
          <div className="flex-1 w-full min-h-[350px] relative overflow-hidden">
             <div className="absolute inset-0">
                 <ParentSize className="w-full h-full">
                   {({ width, height }: { width: number; height: number }) => (
                     <Meteogram data={weather} width={width} height={height} unitSystem={unitSystem} />
                   )}
                 </ParentSize>
             </div>
          </div>
       </main>
    </div>
  );
}

export default App;
