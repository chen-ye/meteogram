import { useState, useEffect } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproximate, setIsApproximate] = useState(false);

  useEffect(() => {
    // Helper to fetch IP location
    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!res.ok) throw new Error('IP Location service failed');
        const data = await res.json();

        setLocation({
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        });
        setIsApproximate(true);
        setError(null); // Clear any previous browser error if IP works
      } catch (err) {
        // If both fail, keep the original browser error or a generic one
        // We leave the browser error if it was set, or set a new one
        if (err instanceof Error) {
            console.error("IP fallback failed:", err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      // Fallback immediately if no geolocation support
      fetchIpLocation();
      return;
    }

    const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 * 60 * 5
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsApproximate(false);
        setLoading(false);
      },
      (err) => {
        // Browser location failed, try IP fallback
        let msg = err.message;
        if (err.code === err.TIMEOUT) {
            msg = "Location request timed out. Trying IP location...";
        } else if (err.code === err.PERMISSION_DENIED) {
            msg = "Location permission denied. Using IP location...";
        }

        // Don't set error yet, strictly; wait for IP fallback
        // But maybe log it or set it temporarily?
        // Better: Try IP, if that fails, set the error.

        console.warn(msg);
        fetchIpLocation().catch(() => {
            // If IP also fails, set the final error
            setError(msg || "Unable to retrieve location.");
            setLoading(false);
        });
      },
      options
    );
  }, []);

  return { location, error, loading, isApproximate };
}
