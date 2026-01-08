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
    return u === 'metric' || u === 'imperial' ? u : 'metric';
  });

  // Manual Location State (from URL)
  const [manualLocation, setManualLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(() => {
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
    setUnitSystem((prev) => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      const params = new URLSearchParams(window.location.search);
      params.set('units', next);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
      return next;
    });
  };

  const { weather, isLoading, isError } = useWeather(
    activeLocation?.latitude,
    activeLocation?.longitude,
  );
  const { locationName, countryCode } = useGeocoding(
    activeLocation?.latitude,
    activeLocation?.longitude,
  );

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
            <p className="mb-2 text-xl">Location Error</p>
            <p>{locError}</p>
            <p className="mt-4 text-sm text-slate-400">Please enable location services.</p>
          </div>
        ) : (
          <div className="flex animate-pulse flex-col items-center">
            <span className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white"></span>
            <p className="text-xl font-light tracking-wide">Locating you...</p>
          </div>
        )}
      </FullScreenMessage>
    );
  }

  if (isLoading) {
    return (
      <FullScreenMessage>
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-white/50"></div>
      </FullScreenMessage>
    );
  }

  if (isError || !weather || !activeLocation) {
    return (
      <FullScreenMessage>
        <div className="flex flex-col items-center gap-4">
          <p className="font-light text-red-400">Failed to load weather data.</p>
          <button
            onClick={() => updateLocationUrl()}
            className="rounded bg-blue-600 px-4 py-2 text-sm transition-colors hover:bg-blue-500"
          >
            Try Auto-Location
          </button>
        </div>
      </FullScreenMessage>
    );
  }

  return (
    <div className="flex min-h-[100svh] flex-col bg-[#004e92] font-sans text-white selection:bg-blue-500/30">
      {/* Main Gradient Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#004e92] via-[#00387a] to-[#002955]" />

      <header className="z-20 flex shrink-0 flex-col items-start bg-transparent p-8 pb-0 text-left md:p-12 md:pb-0">
        <div className="animate-in fade-in slide-in-from-top-4 relative flex w-full flex-col items-start duration-700">
          {/* Top Right Controls Container */}
          <div className="relative mb-6 flex w-full items-center justify-between gap-3 md:absolute md:top-0 md:right-0 md:mb-0 md:w-auto md:justify-end">
            {/* Location Search & Locate Me */}
            <LocationSearch
              onLocationSelect={(lat, lon) => updateLocationUrl(lat, lon)}
              onLocateMe={() => updateLocationUrl()}
              isLocating={isLocating}
              currentLocationName={
                manualLocation
                  ? locationName
                    ? locationName.toUpperCase()
                    : 'COORDINATES'
                  : locationName
                    ? locationName.toUpperCase()
                    : 'LOCATING...'
              }
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

      <main className="relative mt-auto flex min-h-0 w-full flex-1 flex-col">
        <div className="relative min-h-[350px] w-full flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <ParentSize className="h-full w-full">
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
