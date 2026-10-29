// "11 €", "12.50 €"
export function formatPrice(price: number): string {
  return `${Number.isInteger(price) ? price : price.toFixed(2)} €`;
}

// "350 m" (rounded to 10 m), "1.2 km"
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;
}
