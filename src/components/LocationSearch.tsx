import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Locate } from 'lucide-react';
import { searchLocations, type GeocodingResult } from '../hooks/useGeocoding';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number) => void;
  onLocateMe: () => void;
  isLocating: boolean;
  currentLocationName: string;
}

export function LocationSearch({
  onLocationSelect,
  onLocateMe,
  isLocating,
  currentLocationName,
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const data = await searchLocations(query);
          setResults(data);
          setIsOpen(true);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative flex h-8 w-full items-center gap-3 md:w-auto" ref={containerRef}>
      {/* Search Input Container */}
      <div className="group relative h-full flex-1 md:flex-none">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={currentLocationName || 'Search city...'}
          className="h-full w-full rounded-lg border border-white/5 bg-blue-950/20 py-1 pr-3 pl-8 text-xs font-medium text-white backdrop-blur-sm transition-all duration-300 outline-none [interpolate-size:allow-keywords] placeholder:text-blue-200/30 focus:border-white/10 focus:bg-blue-950/40 md:field-sizing-content md:w-auto md:focus:w-48"
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-blue-200/40 transition-colors group-focus-within:text-white/60">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MapPin className="h-3.5 w-3.5" />
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="animate-in fade-in zoom-in-95 absolute top-full right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#0f172a]/95 shadow-xl backdrop-blur-md duration-200">
            {results.map((res) => (
              <button
                key={res.id}
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs text-blue-100 transition-colors hover:bg-white/10"
                onClick={() => {
                  onLocationSelect(res.latitude, res.longitude);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className="font-bold">{res.name}</span>
                <span className="text-[10px] tracking-wider text-blue-200/50 uppercase">
                  {[res.admin1, res.country].filter(Boolean).join(', ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Locate Me Button */}
      <button
        onClick={onLocateMe}
        disabled={isLocating}
        title="Use my location"
        className="group flex h-full items-center justify-center rounded-lg border border-white/5 bg-blue-950/20 px-2 text-blue-200/40 backdrop-blur-sm transition-all hover:bg-blue-950/40 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Locate className={`h-3.5 w-3.5 ${isLocating ? 'animate-bounce' : ''}`} />
      </button>
    </div>
  );
}
