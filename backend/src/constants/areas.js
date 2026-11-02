// The areas Explore Events filters by, the same ids as eventLocations in
// frontend/src/data/eventsData.js. locations.area holds one of them or NULL
export const AREAS = ['city-centre', 'northern-quarter', 'mediacity', 'salford', 'heaton-park'];

// A venue's area is worked out from where it is, never picked, so two
// organisers using the same venue can't disagree (decided 2026-11-02).
// Rough boxes, checked in order: the small areas inside a bigger one come
// first. Anywhere else in Greater Manchester has no area
const AREA_BOXES = [
    // Shudehill and Swan Street to Great Ancoats Street, Piccadilly to Angel Meadow
    { area: 'northern-quarter', south: 53.4815, north: 53.4870, west: -2.2400, east: -2.2270 },
    { area: 'mediacity', south: 53.4680, north: 53.4760, west: -2.3060, east: -2.2900 },
    { area: 'heaton-park', south: 53.5250, north: 53.5450, west: -2.2700, east: -2.2350 },
    // Inside the inner ring road, Castlefield included
    { area: 'city-centre', south: 53.4690, north: 53.4880, west: -2.2600, east: -2.2260 },
    // West of the Irwell, Ordsall and the Quays to Kersal; south edge above Old Trafford
    { area: 'salford', south: 53.4655, north: 53.5250, west: -2.3300, east: -2.2550 },
];

export function areaFor(latitude, longitude) {
    const box = AREA_BOXES.find(({ south, north, west, east }) =>
        latitude >= south && latitude <= north && longitude >= west && longitude <= east);
    return box?.area ?? null;
}

// Venues can only be in Greater Manchester (schema decision, 2026-10-05)
export const GREATER_MANCHESTER = { south: 53.33, north: 53.69, west: -2.73, east: -1.91 };
