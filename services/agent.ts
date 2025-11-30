export type Place = {
  name: string;
  lat: number;
  lng: number;
  description: string;
  image_url: string;
  maps_url: string;
  is_verified: boolean;
};

export type ItineraryActivity = {
  time: string;
  name: string;
  details: string;
  location?: string;
  durationHours?: number;
};

export type ItineraryDay = {
  day: number;
  title: string;
  summary: string;
  activities: ItineraryActivity[];
  tips?: string[];
};

export type ItineraryRequest = {
  startingCity: string;
  days: number;
  travelStyle?: 'culture' | 'food' | 'nature' | 'adventure' | 'mixed';
  budgetLevel?: 'budget' | 'midrange' | 'luxury';
  mustVisit?: string[];
};

const AI_API_KEY = 'PY1mp_jAWVOnLtKYPi6GOU2FaHtfAYnH';
const AI_API_BASE_URL = 'https://nz7cdropb63fto3ehy66zrfj.agents.do-ai.run/api/v1/chat/completions';
const ITINERARY_AGENT_URL = 'https://sqopgfzqwxjrq2xykx45xkps.agents.do-ai.run/api/v1/chat/completions';
const ITINERARY_MODEL = 'malaysia-tour-itinerary-designer';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_THROTTLE_MS = 1100;
const NOMINATIM_CACHE = new Map<string, any | null>();
let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimRun = 0;

const UNSPLASH_ACCESS_KEY = 'ilxPLRo0doCZCFm57WnCMcR1rjB8AMThmswqEOtgw5M'; // Get from https://unsplash.com/developers
const ITINERARY_AGENT_KEY = 'H6DmuKTxRkw5aUb5KyTj1wraTKLS3grO'

function normalizePlaceName(name: string): string {
  return name.trim().toLowerCase();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonContent<T = any>(raw: string): T | null {
  const tryParse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match?.[1]) {
      const parsed = tryParse(match[1]);
      if (parsed) return parsed;
    }
  }

  return tryParse(trimmed);
}

function enqueueNominatimRequest() {
  nominatimQueue = nominatimQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, NOMINATIM_THROTTLE_MS - (now - lastNominatimRun));
    if (wait > 0) {
      await delay(wait);
    }
    lastNominatimRun = Date.now();
  });
  return nominatimQueue;
}

// Get an image URL from Unsplash based on place name and category
async function getUnsplashImage(placeName: string, category: string): Promise<string> {
  if (!UNSPLASH_ACCESS_KEY) {
    return ''; // No API key set
  }

  try {
    // Clean place name and create search query
    const cleanName = placeName.replace(/[^\w\s]/gi, '').trim();
    const searchQuery = `${category} ${cleanName} Malaysia`.trim();

    const params = new URLSearchParams({
      query: searchQuery,
      orientation: 'landscape',
      per_page: '1',
    });

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status}`);
      return '';
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Use regular size image
      return data.results[0].urls.regular || '';
    }

    return '';
  } catch (error) {
    console.warn('Unsplash image fetch failed:', error);
    return '';
  }
}

async function searchOSMPlace(
  placeName: string,
): Promise<any | null> {
  const cacheKey = normalizePlaceName(placeName);
  if (NOMINATIM_CACHE.has(cacheKey)) {
    return NOMINATIM_CACHE.get(cacheKey);
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await enqueueNominatimRequest();

      const params = new URLSearchParams({
        q: placeName,
        format: 'json',
        limit: '1',
        countrycodes: 'MY', // Limit to Malaysia for better results
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      if (Array.isArray(json) && json.length > 0) {
        const result = json[0];
        const formatted = {
          name: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name,
        };
        NOMINATIM_CACHE.set(cacheKey, formatted);
        return formatted;
      }

      // No results, break retry loop
      NOMINATIM_CACHE.set(cacheKey, null);
      return null;

    } catch (e) {
      const isLastAttempt = attempt === 3;
      console.warn(`OSM Nominatim attempt ${attempt} failed:`, e);
      if (isLastAttempt) {
        console.warn(`OSM Nominatim failed after ${attempt} attempts`);
      } else {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  NOMINATIM_CACHE.set(cacheKey, null);
  return null;
}

// Supplemental OSM search using Overpass API for additional verified places
async function searchOSMSupplement(
  category: string,
  latitude: number,
  longitude: number,
  limit: number = 10
): Promise<Place[]> {
  const amenityMap: Record<string, string[]> = {
    food: ['restaurant', 'cafe', 'fast_food'],
    nature: ['park', 'nature_reserve', 'garden'],
    attractions: ['attraction', 'historic', 'monument', 'museum', 'artwork'],
  };

  const amenities = amenityMap[category] || ['place'];

  try {
    // Build Overpass query
    const radius = 10000; // 10km radius
    const amenityQueries = amenities.map(amenity =>
      `node["amenity"="${amenity}"](around:${radius},${latitude},${longitude});`
    ).join('');

    const query = `[out:json][timeout:15];
      (
        ${amenityQueries}
      );
      out center meta;`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements = data?.elements || [];

    // Convert to places, take first 'limit' results
    const supplementPlaces: Place[] = await Promise.all(
      elements.slice(0, limit).map(async (element: any) => {
        const name = element.tags?.name || `${category.charAt(0).toUpperCase() + category.slice(1)} Place`;
        const lat = element.center?.lat || element.lat;
        const lng = element.center?.lng || element.lon;

        // Get Unsplash image
        const image_url = await getUnsplashImage(name, category);

        return {
          name,
          lat,
          lng,
          description: `${name} - ${element.tags?.['addr:street'] || element.tags?.description || 'Nearby location'}`,
          image_url,
          maps_url: `https://www.google.com/maps?q=${lat},${lng}`,
          is_verified: true,
        };
      })
    );

    console.log(`Added ${supplementPlaces.length} supplemental OSM places`);
    return supplementPlaces;

  } catch (error) {
    console.warn('OSM supplement search failed:', error);
    return [];
  }
}

export async function fetchNearbyPlaces(
  category: string,
  latitude: number,
  longitude: number,
): Promise<Place[]> {
  try {
    // Call your DO Agent for AI suggestions
    const response = await fetch(AI_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'default',
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              category,
              mode: 'nearby',
              coordinate: { lat: latitude, lng: longitude },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Failed to load places data', response.statusText);
      return [];
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.warn('No content in AI response');
      return [];
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.warn('Invalid JSON from AI', err);
      return [];
    }

    let aiResults = parsed?.results;
    if (!Array.isArray(aiResults)) return [];

    aiResults = aiResults.slice(0, 20);

    // Fetch verified place details for each AI result
    const placesPromises = aiResults.map(async (item: any) => {
      if (!item?.name) return null;

      const osmPlace = await searchOSMPlace(item.name);

      if (!osmPlace) {
        console.warn(`NO OSM RESULTS for: ${item.name}`);
        return {
          name: item.name,
          lat: item.coordinate?.lat || latitude,
          lng: item.coordinate?.lng || longitude,
          description: item.description || 'Nearby location',
          image_url: item.image || '',
          maps_url:
            item.maps_url ||
            `https://www.google.com/maps?q=${item.coordinate?.lat || latitude},${
              item.coordinate?.lng || longitude
            }`,
          is_verified: false,
        };
      }

      const description = item.description || 'Nearby location';

      return {
        name: item.name,
        lat: osmPlace.lat,
        lng: osmPlace.lng,
        description,
        image_url: item.image || '',
        maps_url: `https://www.google.com/maps?q=${osmPlace.lat},${osmPlace.lng}`,
        is_verified: true,
      };
    });

    const places = (await Promise.all(placesPromises)).filter(Boolean) as Place[];
    const verifiedPlaces = places.filter(p => p.is_verified);
    const unverifiedPlaces = places.filter(p => !p.is_verified);

    console.log(`Found ${verifiedPlaces.length} verified and ${unverifiedPlaces.length} unverified places`);

    // If we have less than 10 verified places, supplement with OSM Overpass query
    if (verifiedPlaces.length < 10) {
      console.log('Supplementing with OSM Overpass places...');
      const supplementPlaces = await searchOSMSupplement(category, latitude, longitude, 15 - verifiedPlaces.length);
      verifiedPlaces.push(...supplementPlaces);
    }

    // Return verified first, then unverified
    return [...verifiedPlaces, ...unverifiedPlaces];
  } catch (error) {
    console.warn('Places fetch error', error);
    return [];
  }
}

export async function generateMalaysiaItinerary(request: ItineraryRequest): Promise<ItineraryDay[]> {
  try {
    const response = await fetch(ITINERARY_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ITINERARY_AGENT_KEY}`,
      },
      body: JSON.stringify({
        model: ITINERARY_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are the Malaysia Tour Itinerary Designer. Produce JSON itineraries tailored to user preferences. Always respond with JSON that matches { "itinerary": [ { "day": number, "title": string, "summary": string, "activities": [ { "time": string, "name": string, "details": string } ], "tips": string[] } ] }.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              intent: 'create-itinerary',
              request: {
                startingCity: request.startingCity,
                days: request.days,
                travelStyle: request.travelStyle ?? 'mixed',
                budgetLevel: request.budgetLevel ?? 'midrange',
                mustVisit: request.mustVisit ?? [],
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Itinerary agent failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      console.warn('Itinerary agent returned no content');
      return [];
    }

    const parsed = parseJsonContent<{ itinerary?: ItineraryDay[] } | ItineraryDay[]>(content);
    if (!parsed) {
      console.warn('Unable to parse itinerary JSON');
      return [];
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed.itinerary)) {
      return parsed.itinerary;
    }

    return [];
  } catch (error) {
    console.warn('Itinerary agent error', error);
    return [];
  }
}
export function createItineraryICS(
  itinerary: ItineraryDay[],
  startingDate: Date,
  city: string,
  timezone: string = 'Asia/Kuala_Lumpur',
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Malaysia Tour Designer//AI Itinerary//EN',
    `X-WR-CALNAME:${city} itinerary`,
    `X-WR-TIMEZONE:${timezone}`,
    'BEGIN:VTIMEZONE',
    `TZID:${timezone}`,
    'X-LIC-LOCATION:Asia/Kuala_Lumpur',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'TZNAME:MYT',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  itinerary.forEach((day) => {
    const activities: ItineraryActivity[] =
      day.activities && day.activities.length > 0
        ? day.activities
        : [
            {
              time: '09:00',
              name: day.title,
              details: day.summary,
              durationHours: 4,
            },
          ];

    activities.forEach((activity, index) => {
      const dayOffset = day.day - 1;

      // Build base date in LOCAL timezone (NOT UTC)
      const eventDate = new Date(startingDate);
      eventDate.setDate(eventDate.getDate() + dayOffset);

      // Parse start time
      const startTime = parseActivityTime(activity.time, index);

      // Build start datetime (local)
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

      // End datetime (local)
      const durationHours = activity.durationHours ?? 2;
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + durationHours);

      // Clean UID (avoid Unicode & special chars)
      const uidBase = activity.name
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .toLowerCase();

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uidBase}-${day.day}-${index}@malaysia-tour`);
      lines.push(`DTSTAMP:${formatDateLocal(new Date())}`);
      lines.push(`DTSTART;TZID=${timezone}:${formatDateLocal(startDateTime)}`);
      lines.push(`DTEND;TZID=${timezone}:${formatDateLocal(endDateTime)}`);
      lines.push(`SUMMARY:${escapeICSText(activity.name)}`);
      lines.push(`DESCRIPTION:${escapeICSText(activity.details || '')}`);
      if (activity.location) {
        lines.push(`LOCATION:${escapeICSText(activity.location)}`);
      }
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * FORMAT LOCAL TIME (NO "Z")
 */
function formatDateLocal(date: Date) {
  const pad = (v: number) => String(v).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * TIME PARSER
 */
function parseActivityTime(time: string | undefined, index: number): { hours: number; minutes: number } {
  if (!time) return { hours: 9 + index * 3, minutes: 0 };

  const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return { hours: 9 + index * 3, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * ESCAPE TEXT
 */
function escapeICSText(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}
