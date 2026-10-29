export type Coordinates = { lat: number; lon: number };

// Great-circle distance (haversine formula).
export function distanceInMeters(a: Coordinates, b: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

// A Google Maps search for a point or an address.
export function mapsSearchUrl(target: Coordinates | string): string {
  const query = typeof target === "string" ? target : `${target.lat},${target.lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Reads a Contentful Location value; anything else gives null.
export function toCoordinates(value: unknown): Coordinates | null {
  const { lat, lon } = (value ?? {}) as { lat?: unknown; lon?: unknown };
  return typeof lat === "number" && typeof lon === "number" ? { lat, lon } : null;
}

const EARTH_RADIUS_METERS = 6_371_000;
