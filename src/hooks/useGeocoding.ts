import useSWR from 'swr';

interface GeocodingResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

const fetchLocationName = async (lat: number, lon: number) => {
  // Using BigDataCloud's free client-side reverse geocoding API which supports CORS
  const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
  if (!res.ok) throw new Error('Failed to fetch location name');
  return res.json();
};

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export const searchLocations = async (query: string): Promise<GeocodingResult[]> => {
  if (!query || query.length < 2) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
  if (!res.ok) throw new Error('Geocoding search failed');
  const data = await res.json();
  return data.results || [];
};

export function useGeocoding(lat?: number, lon?: number) {
  const { data, error, isLoading } = useSWR<GeocodingResponse>(
    lat && lon ? ['geocoding', lat, lon] : null,
    () => fetchLocationName(lat!, lon!)
  );

  return {
    locationName: data?.city || data?.locality || data?.principalSubdivision,
    admin1: data?.principalSubdivision,
    country: data?.countryName,
    isLoading,
    isError: error,
  };
}
