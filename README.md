# Meteogram

A [meteogram](https://en.wikipedia.org/wiki/Meteogram)-style weather PWA,
heavily inspired by [Weathergram](https://weathergram.io). Designed for
intuitive but high (temporal) resolution weather visualization.

✨Vibecoded✨, mostly

## Architecture

- **Core**: [React 19](https://react.dev),
  [TypeScript](https://www.typescriptlang.org), [Vite](https://vitejs.dev)
- **Styling**: [Tailwind](https://tailwindcss.com) (ugh)
- **Dataviz**: [visx](https://airbnb.io/visx)
- **Datasource**: [Open-Meteo](https://open-meteo.com)
- **State Management**: [swr](https://swr.vercel.app) for caching and background
  revalidation

### Key Components

- `Meteogram.tsx`: Main visualization container. Handles dimensions and
  responsive scaling.
- `useMeteogramScales.ts`: D3 scale definitions (Time, Temp, Wind, Rain).
- `*Layer.tsx`: Individual visual layers (Temperature band, Cloud streamgraph,
  Wind barbs).

## Notes

- **Geocoding**: Uses Open-Meteo's Geocoding API for search, with IP-based
  fallback (geojs.io) when browser geolocation is denied.
- **PWA**: Installs as a live-refreshing PWA. Allegedly offline-capable.
- **Deploy**: Static site compatible (GitHub Pages ready).
