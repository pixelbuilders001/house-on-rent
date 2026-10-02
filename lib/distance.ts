import type { Property } from './mock-data/types';
export function getMockDistance(p:Property){return {distanceKm:p.distanceKm,minutes:p.commuteMinutes,source:'Prototype estimate'};}
