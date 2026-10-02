import type { Property } from './types';
const base = [
 ['Shree Residency','PG','Station Road',1.2,8,4.7,24,5500,2000,2,'3 Sharing',true,true,true,'#dcece0','abc-college'],
 ['Aashray Student Home','Hostel','Vidyapati Nagar',2.1,12,4.5,18,4200,1000,4,'4 Sharing',true,false,true,'#e7e4d7','abc-college'],
 ['Mithila Nest','PG','College Road',0.8,6,4.8,31,6800,3000,1,'2 Sharing',true,true,true,'#dfeaf0','abc-college'],
 ['Sita Girls Residence','Hostel','Gandhi Chowk',1.7,10,4.6,16,5900,5000,3,'3 Sharing',true,true,false,'#efe3e6','xyz-hospital'],
 ['Green Leaf Rooms','Room','Kashipur',3.1,16,4.2,11,3500,0,2,'Private room',false,false,true,'#e2ead8','railway-station'],
 ['Railway View PG','PG','Station Road',0.5,4,4.4,20,5000,10000,5,'Bed',true,false,true,'#e9e4dc','railway-station'],
 ['Nayi Disha Homes','PG','Bajitpur',4.4,21,4.3,9,4800,1500,3,'3 Sharing',true,false,true,'#e3e9e4','industrial-area'],
 ['City Corner Stay','Room','Main Market',2.8,15,4.1,7,7200,4000,1,'Private room',false,false,false,'#eee2d7','main-market'],
 ['Udaan Women’s PG','PG','College Road',1.1,7,4.9,42,6200,2500,2,'2 Sharing',true,true,true,'#e9e0eb','xyz-college'],
 ['Savera Hostel','Hostel','Hospital Road',1.4,9,4.4,14,3900,1000,6,'Bed',true,false,true,'#e4eadc','district-hospital'],
 ['Apna Aangan','Flat','Adarsh Nagar',5.2,24,4.0,8,9500,10000,1,'Private room',false,false,true,'#e5e0d8','industrial-area'],
 ['Campus Comforts','PG','Vidyapati Nagar',1.5,9,4.6,27,5600,3000,2,'3 Sharing',true,true,true,'#e4ebee','abc-college'],
 ['Shanti Niwas','Room','Gola Road',2.3,13,4.2,10,4500,2000,1,'Private room',true,false,false,'#eee6dd','bus-stand'],
 ['Bluebell PG','PG','Patel Chowk',3.6,18,4.5,15,6400,5000,0,'2 Sharing',true,false,true,'#dfe9ef','main-market'],
 ['Sahyog Stay','Hostel','Industrial Area',1.8,10,4.1,6,4100,0,7,'Bed',true,false,true,'#e4ebdf','industrial-area'],
 ['Maa Janki Homes','PG','Kashipur',2.0,11,4.7,19,7700,6000,2,'2 Sharing',true,true,true,'#eee3d9','xyz-college'],
 ['Pragati Rooms','Room','Bus Stand Road',3.0,17,3.9,5,5200,1500,1,'Private room',false,false,true,'#e7e6dc','bus-stand'],
 ['Nirmal PG','PG','Hospital Road',0.9,6,4.6,22,5800,2500,3,'3 Sharing',true,false,true,'#e3eee8','district-hospital'],
 ['Sakhi Shared Living','Hostel','Gandhi Chowk',2.5,14,4.8,29,6900,3500,2,'2 Sharing',true,true,true,'#eee3eb','xyz-hospital'],
 ['Nagar View Residency','Flat','Adarsh Nagar',4.0,19,4.3,12,8300,7000,1,'Private room',false,false,true,'#e5e8e4','railway-station']
] as const;
export const mockProperties: Property[] = base.map((p, i) => ({
 id:`prop-${String(i+1).padStart(3,'0')}`, name:p[0], type:p[1] as Property['type'], city:'Samastipur', area:p[2], distanceKm:p[3], commuteMinutes:p[4], rating:p[5], reviewCount:p[6], rent:p[7], deposit:p[8], availableBeds:p[9], accommodation:p[10], foodAvailable:p[11], foodIncluded:p[12], wifi:p[13], color:p[14], destination:p[15],
 verified:i%4!==3, verificationLevel:i%4===3?'owner_verified':'property_verified', brokerage:i%6===0?1000:0, electricity:i%3===0?350:300, wifiCost:200, maintenance:200, foodCost:p[12]?0:(p[11]?1200:0), electricityIncluded:i%3===1, totalBeds:[40,24,18,32,12,36,20,8,28,30,6,34,10,24,40,26,8,30,32,12][i], amenities:['Wi-Fi',...(p[11]?['Food']:[]),...(i%3===0?['Laundry']:[]),...(i%2===0?['Study table']:['Fan']),'Wardrobe',...(i%4===0?['Attached bathroom']:[])], image:'', description:`A friendly, budget-conscious ${String(p[1]).toLowerCase()} in ${p[2]}, with practical amenities and easy access to everyday essentials. Demo listing for the RoomSaathi prototype.`, owner:['Raj Kumar','Neha Singh','Amit Jha','Pooja Kumari'][i%4], rules:['Keep shared spaces tidy','Quiet hours after 10:30 PM','Visitors by prior approval'], updated:`${i+1} days ago`
}));
