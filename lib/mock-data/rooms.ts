import { mockProperties } from './properties';
export const mockRooms = mockProperties.flatMap((p) => Array.from({length:3},(_,i)=>({id:`${p.id}-room-${201+i}`,propertyId:p.id,room:`${201+i}`,accommodation:p.accommodation,bed:`Bed ${i+1}`,status:i<Math.min(p.availableBeds,2)?'available':'occupied',rent:p.rent})));
