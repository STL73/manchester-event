import { AppError } from './errors.js';
import { GREATER_MANCHESTER, areaFor } from '../constants/areas.js';

// Venues from OpenStreetMap: Photon to search as you type (Nominatim forbids it),
// Nominatim to look a place up by id. Both are free servers asking for fair use,
// hence the User-Agent, the cache and the per-user limit

const USER_AGENT = 'manchester-event-portal/1.0';
const TIMEOUT_MS = 5000;
const { south, north, west, east } = GREATER_MANCHESTER;

const inGreaterManchester = (latitude, longitude) =>
    latitude >= south && latitude <= north && longitude >= west && longitude <= east;

async function getJson(url) {
    let res;
    try {
        res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (error) {
        console.error('OpenStreetMap request failed:', error.message);
        throw new AppError(503, 'Venue search isn\'t available right now. Please try again in a minute.');
    }
    if (!res.ok) {
        console.error('OpenStreetMap answered', res.status, url.origin);
        throw new AppError(503, 'Venue search isn\'t available right now. Please try again in a minute.');
    }
    return res.json();
}

// "27 Peter Street, Manchester M2 5QR", the seed's format. The street is left
// out when it is the place itself (a square, a park)
function formatAddress({ name, houseNumber, street, city, postcode }) {
    const streetLine = street && street !== name ? [houseNumber, street].filter(Boolean).join(' ') : null;
    const townLine = [city, postcode].filter(Boolean).join(' ');
    return [streetLine, townLine].filter(Boolean).join(', ');
}

// Answers are kept for 10 minutes: people retype the same few letters
const cache = new Map();
const CACHE_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;

// Up to 5 places matching what was typed, inside Greater Manchester
export async function searchPlaces(query) {
    const key = query.toLowerCase();
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return hit.places;

    const url = new URL('https://photon.komoot.io/api/');
    url.search = new URLSearchParams({ q: query, limit: '10', lang: 'en', bbox: [west, south, east, north].join(',') });
    const { features = [] } = await getJson(url);

    const places = [];
    const seen = new Set();
    for (const { properties: p, geometry } of features) {
        const [longitude, latitude] = geometry.coordinates;
        if (!p.name || !inGreaterManchester(latitude, longitude)) continue;
        // Bus and tram stops share their square's name and are never the venue
        if (p.osm_key === 'public_transport' || (p.osm_key === 'highway' && ['bus_stop', 'platform'].includes(p.osm_value))) continue;
        const address = formatAddress({
            name: p.name,
            houseNumber: p.housenumber,
            street: p.street,
            city: p.city ?? p.town ?? p.village ?? p.district,
            postcode: p.postcode,
        });
        // One street is often several OSM ways: show it once
        const label = `${p.name}|${address}`;
        if (seen.has(label)) continue;
        seen.add(label);
        places.push({ placeId: `${p.osm_type}${p.osm_id}`, name: p.name, address, area: areaFor(latitude, longitude) });
        if (places.length === 5) break;
    }

    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, { places, expires: Date.now() + CACHE_MS });
    return places;
}

// One place by its OSM id, as a locations row; null when OSM doesn't know it or
// it is outside Greater Manchester
export async function lookupPlace(placeId) {
    const url = new URL('https://nominatim.openstreetmap.org/lookup');
    url.search = new URLSearchParams({ osm_ids: placeId, format: 'jsonv2', addressdetails: '1' });
    const [place] = await getJson(url);
    if (!place) return null;

    const latitude = Number(place.lat);
    const longitude = Number(place.lon);
    if (!inGreaterManchester(latitude, longitude)) return null;

    const a = place.address ?? {};
    const locationName = place.name || a.road;
    if (!locationName) return null;
    const address = formatAddress({
        name: locationName,
        houseNumber: a.house_number,
        street: a.road,
        city: a.city ?? a.town ?? a.village ?? a.suburb,
        postcode: a.postcode,
    }) || place.display_name;
    return {
        placeId,
        locationName: locationName.slice(0, 255),
        address: address.slice(0, 255),
        latitude,
        longitude,
        area: areaFor(latitude, longitude),
    };
}
