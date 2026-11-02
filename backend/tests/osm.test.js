import { describe, it, expect, afterEach, vi } from 'vitest';

import { areaFor } from '../src/constants/areas.js';
import { lookupPlace, searchPlaces } from '../src/lib/osm.js';

// fetch answers from here, so nothing reaches OpenStreetMap's servers
function answer(body, status = 200) {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
}

afterEach(() => vi.unstubAllGlobals());

// Shaped like Photon's answers, trimmed to what lib/osm.js reads
const feature = (properties, [longitude, latitude]) => ({
    properties: { osm_key: 'amenity', osm_value: 'events_venue', city: 'Manchester', ...properties },
    geometry: { coordinates: [longitude, latitude] },
});

describe('areaFor', () => {
    it('puts places in the area whose box holds them, the small areas first', () => {
        expect(areaFor(53.4783, -2.2479)).toBe('city-centre'); // Albert Hall
        expect(areaFor(53.4830, -2.2357)).toBe('northern-quarter'); // Stevenson Square, inside the centre's box too
        expect(areaFor(53.4706, -2.2961)).toBe('mediacity'); // The Lowry
        expect(areaFor(53.4870, -2.2720)).toBe('salford'); // Peel Park
        expect(areaFor(53.5355, -2.2525)).toBe('heaton-park');
    });

    it('gives no area outside them', () => {
        expect(areaFor(53.4831, -2.2004)).toBeNull(); // Etihad Stadium
        expect(areaFor(53.4631, -2.2913)).toBeNull(); // Old Trafford, south of Salford's box
    });
});

describe('searchPlaces', () => {
    it('asks Photon within Greater Manchester and names who is asking', async () => {
        const fetch = answer({ features: [] });
        await searchPlaces('photon-request-check');
        const [url, options] = fetch.mock.calls[0];
        expect(url.hostname).toBe('photon.komoot.io');
        expect(url.searchParams.get('bbox')).toBe('-2.73,53.33,-1.91,53.69');
        expect(options.headers['User-Agent']).toMatch(/manchester-event/);
    });

    it('turns places into the venue box\'s rows, without stops, repeats or far-off places', async () => {
        answer({
            features: [
                feature({ osm_type: 'W', osm_id: 30343319, name: 'Albert Hall', housenumber: '27', street: 'Peter Street', postcode: 'M2 5QR' }, [-2.2479, 53.4783]),
                // A square's name and address are the same: no street line
                feature({ osm_type: 'W', osm_id: 1, name: 'Stevenson Square', street: 'Stevenson Square', postcode: 'M1 1FB' }, [-2.2339, 53.4825]),
                feature({ osm_type: 'W', osm_id: 2, name: 'Stevenson Square', street: 'Stevenson Square', postcode: 'M1 1FB' }, [-2.2337, 53.4826]),
                feature({ osm_type: 'N', osm_id: 3, name: 'Stevenson Square (Stop EB)', osm_key: 'highway', osm_value: 'bus_stop' }, [-2.2340, 53.4826]),
                feature({ osm_type: 'N', osm_id: 4, name: 'Liverpool Lime Street', city: 'Liverpool' }, [-2.9779, 53.4075]),
            ],
        });
        expect(await searchPlaces('rows-check')).toEqual([
            { placeId: 'W30343319', name: 'Albert Hall', address: '27 Peter Street, Manchester M2 5QR', area: 'city-centre' },
            { placeId: 'W1', name: 'Stevenson Square', address: 'Manchester M1 1FB', area: 'northern-quarter' },
        ]);
    });

    it('answers a repeated search from its cache', async () => {
        const fetch = answer({ features: [] });
        await searchPlaces('cache-check');
        await searchPlaces('Cache-Check');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('says the search is unavailable when Photon fails', async () => {
        answer({}, 502);
        await expect(searchPlaces('failure-check')).rejects.toMatchObject({ status: 503 });
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
        await expect(searchPlaces('timeout-check')).rejects.toMatchObject({ status: 503 });
    });
});

describe('lookupPlace', () => {
    const nominatim = (overrides = {}) => [{
        lat: '53.4782991',
        lon: '-2.2479018',
        name: 'Albert Hall',
        address: { house_number: '27', road: 'Peter Street', city: 'Manchester', postcode: 'M2 5QR' },
        ...overrides,
    }];

    it('returns a locations row with the area worked out', async () => {
        const fetch = answer(nominatim());
        expect(await lookupPlace('W30343319')).toEqual({
            placeId: 'W30343319',
            locationName: 'Albert Hall',
            address: '27 Peter Street, Manchester M2 5QR',
            latitude: 53.4782991,
            longitude: -2.2479018,
            area: 'city-centre',
        });
        expect(fetch.mock.calls[0][0].searchParams.get('osm_ids')).toBe('W30343319');
    });

    it('returns null for an unknown place or one outside Greater Manchester', async () => {
        answer([]);
        expect(await lookupPlace('N1')).toBeNull();
        answer(nominatim({ lat: '53.4075', lon: '-2.9779' }));
        expect(await lookupPlace('N2')).toBeNull();
    });
});
