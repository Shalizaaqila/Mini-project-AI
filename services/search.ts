export type SearchResult = {
  place_id: string;
  osm_id: string;
  osm_type: string;
  licence: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: string[];
};

export async function searchPlaces(query: string, countrycodes: string = 'MY'): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '10',
      countrycodes: countrycodes, // MY for Malaysia
      dedupe: '1',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        'User-Agent': 'Malaysia-Travel-App/1.0',
      },
    });

    if (!response.ok) {
      console.warn('OSM search failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data as SearchResult[];
  } catch (error) {
    console.warn('OSM search error:', error);
    return [];
  }
}

export type FormattedSearchResult = {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  categories: string[];
  osmClass: string;
  osmType: string;
};

const categoryMatchers: { id: string; test: (result: SearchResult) => boolean }[] = [
  {
    id: 'city',
    test: (result) =>
      result.class === 'place' && ['city', 'town', 'village', 'suburb', 'quarter'].includes(result.type),
  },
  {
    id: 'culture',
    test: (result) =>
      (result.class === 'tourism' &&
        ['museum', 'gallery', 'attraction', 'artwork', 'theatre', 'theme_park', 'zoo'].includes(result.type)) ||
      (result.class === 'historic' && ['memorial', 'ruins', 'castle', 'monument', 'heritage'].includes(result.type)) ||
      (result.class === 'amenity' && ['place_of_worship', 'university', 'school'].includes(result.type)),
  },
  {
    id: 'island',
    test: (result) => ['island', 'islet', 'archipelago'].includes(result.type),
  },
  {
    id: 'nature',
    test: (result) =>
      (result.class === 'natural' &&
        ['bay', 'beach', 'cliff', 'wood', 'coastline', 'water', 'peak', 'volcano'].includes(result.type)) ||
      (result.class === 'leisure' && ['park', 'garden', 'nature_reserve', 'water_park'].includes(result.type)) ||
      (result.class === 'landuse' && ['forest'].includes(result.type)),
  },
  {
    id: 'adventure',
    test: (result) =>
      (result.class === 'natural' && ['peak', 'volcano', 'hill'].includes(result.type)) ||
      (result.class === 'tourism' && ['camp_site', 'viewpoint', 'trail_riding_station'].includes(result.type)) ||
      (result.class === 'leisure' && ['sports_centre', 'pitch'].includes(result.type)),
  },
];

function inferCategories(result: SearchResult): string[] {
  const matches = categoryMatchers
    .filter((matcher) => matcher.test(result))
    .map((matcher) => matcher.id);
  return matches.length ? matches : ['general'];
}

export function formatSearchResult(result: SearchResult): FormattedSearchResult {
  return {
    id: result.place_id,
    name: result.name || result.display_name.split(',')[0],
    address: result.display_name,
    coordinates: {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    },
    categories: inferCategories(result),
    osmClass: result.class,
    osmType: result.type,
  };
}
