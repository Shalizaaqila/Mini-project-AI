import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import Papa from 'papaparse';
import fetch from 'node-fetch';

const API_BASE = 'https://api.data.gov.my/gtfs-static';
const PRASARANA_CATEGORIES = [
  'rapid-bus-kl',
  'rapid-bus-penang',
  'rapid-bus-kuantan',
  'rapid-bus-mrtfeeder',
  'rapid-rail-kl',
] as const;
const MYBAS_AGENCIES = [
  'mybas-kangar',
  'mybas-alor-setar',
  'mybas-kota-bharu',
  'mybas-kuala-terengganu',
  'mybas-melaka',
  'mybas-johor',
  'mybas-kuching',
] as const;

const ENV_GTFS_URL = process.env.GTFS_URL;
const ENV_GTFS_AGENCY = process.env.GTFS_AGENCY?.toLowerCase();
const ENV_GTFS_CATEGORY = process.env.GTFS_CATEGORY?.toLowerCase();
const MAX_STOPS = Number(process.env.GTFS_MAX_STOPS ?? '400');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'gtfs-data.json');

type StopRow = {
  stop_id?: string;
  stop_name?: string;
  stop_lat?: string;
  stop_lon?: string;
};

type RouteRow = {
  route_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  agency_id?: string;
  route_type?: string;
};

type TripRow = {
  trip_id?: string;
  route_id?: string;
};

type StopTimeRow = {
  trip_id?: string;
  stop_id?: string;
};

const ROUTE_TYPE_MAP: Record<string, string> = {
  '0': 'Tram/Light Rail',
  '1': 'Metro',
  '2': 'Rail',
  '3': 'Bus',
  '4': 'Ferry',
  '5': 'Cable Car',
  '6': 'Gondola',
  '7': 'Funicular',
};

function parseCsv<T>(content: Buffer | string) {
  const text = typeof content === 'string' ? content : content.toString('utf-8');
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length) {
    console.warn('CSV parse warnings:', result.errors.slice(0, 3));
  }

  return result.data as T[];
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function tryDownload(url: string) {
  console.log(`Attempting GTFS download: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`⚠️  Unable to download from ${url} (${response.status} ${response.statusText})`);
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  console.log(`✅ Downloaded GTFS from ${url}`);
  return Buffer.from(arrayBuffer);
}

function buildCandidateUrls() {
  if (ENV_GTFS_URL) {
    return [ENV_GTFS_URL];
  }

  if (ENV_GTFS_AGENCY === 'prasarana') {
    if (ENV_GTFS_CATEGORY) {
      return [`${API_BASE}/prasarana?category=${ENV_GTFS_CATEGORY}`];
    }
    return PRASARANA_CATEGORIES.map((category) => `${API_BASE}/prasarana?category=${category}`);
  }

  if (ENV_GTFS_AGENCY) {
    return [`${API_BASE}/${ENV_GTFS_AGENCY}`];
  }

  return [
    `${API_BASE}/ktmb`,
    ...PRASARANA_CATEGORIES.map((category) => `${API_BASE}/prasarana?category=${category}`),
    ...MYBAS_AGENCIES.map((agency) => `${API_BASE}/${agency}`),
  ];
}

async function downloadZip() {
  const candidateUrls = buildCandidateUrls();

  for (const url of candidateUrls) {
    const buffer = await tryDownload(url);
    if (buffer) {
      return { zipBuffer: buffer, sourceUrl: url };
    }
  }

  throw new Error(
    [
      'Unable to download GTFS feed from the available endpoints.',
      'Set GTFS_AGENCY / GTFS_CATEGORY per https://api.data.gov.my/gtfs-static,',
      'or provide GTFS_URL="https://example.com/feed.zip" before running npm run gtfs:pull.',
    ].join(' '),
  );
}

async function processGtfs() {
  const { zipBuffer, sourceUrl } = await downloadZip();
  const zip = new AdmZip(zipBuffer);

  const stops = parseCsv<StopRow>(zip.readAsText('stops.txt'));
  const routes = parseCsv<RouteRow>(zip.readAsText('routes.txt'));
  const trips = parseCsv<TripRow>(zip.readAsText('trips.txt'));
  const stopTimes = parseCsv<StopTimeRow>(zip.readAsText('stop_times.txt'));

  const tripToRoute = new Map<string, string>();
  for (const trip of trips) {
    if (trip.trip_id && trip.route_id) {
      tripToRoute.set(trip.trip_id, trip.route_id);
    }
  }

  const stopRouteMap = new Map<string, Set<string>>();
  for (const entry of stopTimes) {
    if (!entry.stop_id || !entry.trip_id) continue;
    const routeId = tripToRoute.get(entry.trip_id);
    if (!routeId) continue;
    if (!stopRouteMap.has(entry.stop_id)) {
      stopRouteMap.set(entry.stop_id, new Set());
    }
    stopRouteMap.get(entry.stop_id)!.add(routeId);
  }

  const routeStopCount = new Map<string, number>();
  for (const [, routeIds] of stopRouteMap.entries()) {
    for (const routeId of routeIds) {
      routeStopCount.set(routeId, (routeStopCount.get(routeId) ?? 0) + 1);
    }
  }

  const normalizedStops = stops
    .map((stop) => {
      const lat = toNumber(stop.stop_lat);
      const lon = toNumber(stop.stop_lon);
      if (!stop.stop_id || !stop.stop_name || lat === undefined || lon === undefined) {
        return null;
      }
      const routesServing = [...(stopRouteMap.get(stop.stop_id) ?? new Set())];
      return {
        id: stop.stop_id,
        name: stop.stop_name,
        lat,
        lon,
        routes: routesServing,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      name: string;
      lat: number;
      lon: number;
      routes: string[];
    }>;

  const sortedStops = normalizedStops
    .sort((a, b) => b.routes.length - a.routes.length)
    .slice(0, MAX_STOPS);

  const normalizedRoutes = routes
    .map((route) => {
      if (!route.route_id) return null;
      const type = route.route_type ? ROUTE_TYPE_MAP[route.route_type] ?? 'Transit' : 'Transit';
      return {
        id: route.route_id,
        shortName: route.route_short_name || route.route_id,
        longName: route.route_long_name || route.route_short_name || route.route_id,
        agencyId: route.agency_id || 'Unknown',
        type,
        stopCount: routeStopCount.get(route.route_id) ?? 0,
      };
    })
    .filter(Boolean) as Array<{
      id: string;
      shortName: string;
      longName: string;
      agencyId: string;
      type: string;
      stopCount: number;
    }>;

  await fs.mkdir(DATA_DIR, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceUrl,
    stops: sortedStops,
    routes: normalizedRoutes,
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`GTFS data saved to ${OUTPUT_FILE}`);
  console.log(`Stops stored: ${sortedStops.length} | Routes stored: ${normalizedRoutes.length}`);
}

processGtfs().catch((error) => {
  console.error('Failed to process GTFS feed');
  console.error(error);
  process.exit(1);
});
