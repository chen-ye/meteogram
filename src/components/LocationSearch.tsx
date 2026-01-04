import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchLocations, type GeocodingResult } from '../hooks/useGeocoding';

interface LocationSearchProps {
  onLocationSelect: (lat: number, lon: number) => void;
  onLocateMe: () => void;
  isLocating: boolean;
}

export function LocationSearch({ onLocationSelect, onLocateMe, isLocating }: LocationSearchProps) {
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
    <div className="relative flex items-center h-8 gap-3 w-full md:w-auto" ref={containerRef}>
      {/* Search Input Container */}
      <div className="relative group h-full flex-1 md:flex-none">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city..."
          className="h-full pl-8 pr-3 py-1 bg-blue-950/20 backdrop-blur-sm border border-white/5 rounded-lg text-xs font-medium text-white placeholder:text-blue-200/30 w-full md:w-32 md:focus:w-48 transition-all duration-300 outline-none focus:bg-blue-950/40 focus:border-white/10"
          onFocus={() => {
              if (results.length > 0) setIsOpen(true);
          }}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-blue-200/40 group-focus-within:text-white/60 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-[#0f172a]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                {results.map((res) => (
                    <button
                        key={res.id}
                        className="w-full text-left px-3 py-2 text-xs text-blue-100 hover:bg-white/10 transition-colors flex flex-col gap-0.5"
                        onClick={() => {
                            onLocationSelect(res.latitude, res.longitude);
                            setQuery('');
                            setIsOpen(false);
                        }}
                    >
                        <span className="font-bold">{res.name}</span>
                        <span className="text-[10px] text-blue-200/50 uppercase tracking-wider">
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
        className="h-full px-2 flex items-center justify-center bg-blue-950/20 backdrop-blur-sm border border-white/5 rounded-lg text-blue-200/40 hover:text-white hover:bg-blue-950/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        <MapPin className={`w-3.5 h-3.5 ${isLocating ? 'animate-bounce' : ''}`} />
      </button>
    </div>
  );
}
