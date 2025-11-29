export type Place = {
  name: string;
  lat: number;
  lng: number;
  description: string;
  image_url: string;
  maps_url: string;
  is_verified: boolean;
};

const AI_API_KEY = 'PY1mp_jAWVOnLtKYPi6GOU2FaHtfAYnH';
const AI_API_BASE_URL = 'https://nz7cdropb63fto3ehy66zrfj.agents.do-ai.run/api/v1/chat/completions';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

const UNSPLASH_ACCESS_KEY = 'ilxPLRo0doCZCFm57WnCMcR1rjB8AMThmswqEOtgw5M'; // Get from https://unsplash.com/developers

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
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
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
        return {
          name: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          display_name: result.display_name,
        };
      }

      // No results, break retry loop
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
