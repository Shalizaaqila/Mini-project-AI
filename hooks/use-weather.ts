import { useEffect, useMemo, useState } from 'react';
import { fetchWeatherByCoords, WeatherRequest, WeatherSummary } from '@/services/weather';

type WeatherState = Record<string, WeatherSummary>;

export function useWeatherBatch(requests: WeatherRequest[], enabled = true) {
  const [weatherMap, setWeatherMap] = useState<WeatherState>({});
  const [loading, setLoading] = useState(false);

  const requestKey = useMemo(() => JSON.stringify(requests), [requests]);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      if (!enabled || requests.length === 0) {
        if (isMounted) {
          setWeatherMap({});
        }
        return;
      }

      setLoading(true);
      const entries = await Promise.all(
        requests.map(async (request) => {
          const summary = await fetchWeatherByCoords(request.latitude, request.longitude);
          return summary ? ([request.id, summary] as const) : null;
        }),
      );

      if (isMounted) {
        const filteredEntries = entries.filter(
          (entry): entry is readonly [string, WeatherSummary] => entry !== null,
        );
        setWeatherMap(Object.fromEntries(filteredEntries));
        setLoading(false);
      }
    }

    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [enabled, requestKey, requests]);

  return { weatherMap, loading };
}
