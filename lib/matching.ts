import type { Property } from './mock-data/types';
export type SearchPreferences={min?:number;max?:number;distance?:number;accommodation?:string;food?:string;destination?:string};
export function calculateMatchScore(p:Property,f:SearchPreferences){let score=50; if(f.max&&p.rent<=f.max)score+=18; if(f.min&&p.rent>=f.min)score+=8; if(f.distance&&p.distanceKm<=f.distance)score+=15; if(f.accommodation&&f.accommodation===p.accommodation)score+=12; if(f.food==='included'&&p.foodIncluded)score+=9; if(f.destination&&f.destination===p.destination)score+=12; if(p.verified)score+=5; return score;}
