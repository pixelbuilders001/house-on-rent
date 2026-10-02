export type Property = {
  id: string; name: string; type: 'PG'|'Hostel'|'Room'|'Flat'; city: string; area: string; distanceKm: number; commuteMinutes: number; rating: number; reviewCount: number; verified: boolean; verificationLevel: string;
  rent: number; deposit: number; brokerage: number; electricity: number; wifiCost: number; maintenance: number; foodCost: number; foodAvailable: boolean; foodIncluded: boolean; wifi: boolean; electricityIncluded: boolean; availableBeds: number; totalBeds: number;
  accommodation: string; amenities: string[]; image: string; color: string; description: string; owner: string; rules: string[]; updated: string; destination: string;
};
