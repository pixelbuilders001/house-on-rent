import type { Property } from './mock-data/types';
export const calculateMonthlyCost=(p:Property)=>p.rent+p.electricity+p.wifiCost+p.maintenance+p.foodCost;
export const calculateMoveInCost=(p:Property)=>p.rent+p.deposit+p.brokerage;
