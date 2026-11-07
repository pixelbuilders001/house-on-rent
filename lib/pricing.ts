import type { Property } from './mock-data/types';
export const calculateMonthlyCost = (p: Property) =>
  Number(p?.rent || 0) +
  Number(p?.electricity || 0) +
  Number(p?.wifiCost || 0) +
  Number(p?.maintenance || 0) +
  Number(p?.foodCost || 0);

export const calculateMoveInCost = (p: Property) =>
  Number(p?.rent || 0) +
  Number(p?.deposit || 0) +
  Number(p?.brokerage || 0);
