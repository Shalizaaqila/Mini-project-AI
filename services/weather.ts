export type WeatherSummary = {
  temperature: number;
  description: string;
  weatherCode: number;
};

export type WeatherRequest = {
  id: string;
  latitude: number;
  longitude: number;
};

const CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunder + hail',
  99: 'Severe thunder + hail',
};

export async function fetchWeatherByCoords(
  latitude: number,
  longitude: number,
): Promise<WeatherSummary | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,weather_code',
      timezone: 'auto',
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
      console.warn('Failed to load weather data', response.statusText);
      return null;
    }

    const data = await response.json();
    const weatherCode = data?.current?.weather_code;
    const temperature = data?.current?.temperature_2m;

    if (typeof weatherCode !== 'number' || typeof temperature !== 'number') {
      return null;
    }

    return {
      temperature,
      weatherCode,
      description: CODE_DESCRIPTIONS[weatherCode] ?? 'Weather update',
    };
  } catch (error) {
    console.warn('Weather fetch error', error);
    return null;
  }
}
