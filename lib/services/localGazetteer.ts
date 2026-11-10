/**
 * Curated Local Gazetteer for Instant Google-style Autocomplete
 * Provides rich, zero-latency local landmarks, chowks, roads, and education hubs
 * for supported cities (Samastipur, Patna, Darbhanga, Muzaffarpur).
 */

export interface GazetteerPlace {
  id: string;
  name: string;
  displayName: string;
  subtitle: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  type: 'road' | 'chowk' | 'colony' | 'college' | 'transit' | 'hospital' | 'commercial';
  popularLandmark?: string;
}

export const LOCAL_GAZETTEER: GazetteerPlace[] = [
  // ==========================================
  // SAMASTIPUR LOCALITIES & LANDMARKS
  // ==========================================
  {
    id: 'sp-mohanpur-rd',
    name: 'Mohanpur Road',
    displayName: 'Mohanpur Road, Samastipur',
    subtitle: 'Near Mohanpur Pul, Overbridge & Golambar · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8610,
    longitude: 85.7890,
    type: 'road',
    popularLandmark: 'Mohanpur Pul',
  },
  {
    id: 'sp-mohanpur-chowk',
    name: 'Mohanpur Chowk',
    displayName: 'Mohanpur Chowk, Samastipur',
    subtitle: 'Commercial & Student Hub, Main Market Area · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8625,
    longitude: 85.7875,
    type: 'chowk',
    popularLandmark: 'Mohanpur Market',
  },
  {
    id: 'sp-kashipur',
    name: 'Kashipur',
    displayName: 'Kashipur, Samastipur',
    subtitle: "Near Women's College & Education Zone · PIN 848101",
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8590,
    longitude: 85.7830,
    type: 'colony',
    popularLandmark: "Samastipur Women's College",
  },
  {
    id: 'sp-station-rd',
    name: 'Station Road',
    displayName: 'Station Road, Samastipur',
    subtitle: 'Near Samastipur Junction (0.5 km) · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8640,
    longitude: 85.7790,
    type: 'transit',
    popularLandmark: 'Samastipur Junction',
  },
  {
    id: 'sp-magardahi',
    name: 'Magardahi Ghat',
    displayName: 'Magardahi Ghat, Samastipur',
    subtitle: 'Near Budhi Gandak River Bank & Ghat Road · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8670,
    longitude: 85.7750,
    type: 'chowk',
  },
  {
    id: 'sp-tajpur-rd',
    name: 'Tajpur Road',
    displayName: 'Tajpur Road, Samastipur',
    subtitle: 'Near Sadar Hospital & Bus Stand corridor · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8570,
    longitude: 85.7710,
    type: 'road',
    popularLandmark: 'Sadar Hospital',
  },
  {
    id: 'sp-jitwarpur',
    name: 'Jitwarpur',
    displayName: 'Jitwarpur, Samastipur',
    subtitle: 'Near Industrial Estate & Degree Colleges · PIN 848134',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848134',
    latitude: 25.8450,
    longitude: 85.7950,
    type: 'colony',
  },
  {
    id: 'sp-patel-maidan',
    name: 'Patel Maidan Road',
    displayName: 'Patel Maidan, Samastipur',
    subtitle: 'Central Town, Near Collectorate & Stadium · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8620,
    longitude: 85.7835,
    type: 'colony',
    popularLandmark: 'Patel Maidan',
  },
  {
    id: 'sp-dharampur',
    name: 'Dharampur',
    displayName: 'Dharampur, Samastipur',
    subtitle: 'Peaceful Residential Area near Town Outskirts · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8710,
    longitude: 85.7920,
    type: 'colony',
  },
  {
    id: 'sp-bahadurpur',
    name: 'Bahadurpur',
    displayName: 'Bahadurpur, Samastipur',
    subtitle: 'Near RNAR College & Student PGs · PIN 848101',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848101',
    latitude: 25.8550,
    longitude: 85.7850,
    type: 'colony',
    popularLandmark: 'RNAR College',
  },
  {
    id: 'sp-musrigharari',
    name: 'Musrigharari Chowk',
    displayName: 'Musrigharari, Samastipur',
    subtitle: 'Major National Highway Crossroad Junction · PIN 848211',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848211',
    latitude: 25.7930,
    longitude: 85.7280,
    type: 'transit',
  },
  {
    id: 'sp-rosera',
    name: 'Rosera Town',
    displayName: 'Rosera, Samastipur',
    subtitle: 'Sub-Divisional Town & Market Center · PIN 848210',
    city: 'Samastipur',
    state: 'Bihar',
    pincode: '848210',
    latitude: 25.7500,
    longitude: 86.0160,
    type: 'commercial',
  },

  // ==========================================
  // PATNA LOCALITIES & LANDMARKS
  // ==========================================
  {
    id: 'pat-boring-rd',
    name: 'Boring Road',
    displayName: 'Boring Road, Patna',
    subtitle: 'Prime Student & Coaching Hub, Near AN College · PIN 800001',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    latitude: 25.6130,
    longitude: 85.1160,
    type: 'college',
    popularLandmark: 'AN College & Boring Canal Road',
  },
  {
    id: 'pat-boring-canal',
    name: 'Boring Canal Road',
    displayName: 'Boring Canal Road, Patna',
    subtitle: 'Prominent Coaching Institute Corridor · PIN 800001',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    latitude: 25.6180,
    longitude: 85.1140,
    type: 'road',
  },
  {
    id: 'pat-kankarbagh',
    name: 'Kankarbagh',
    displayName: 'Kankarbagh, Patna',
    subtitle: 'Tiwari Bechar, Near Tempo Stand & Colony · PIN 800020',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800020',
    latitude: 25.5920,
    longitude: 85.1580,
    type: 'colony',
  },
  {
    id: 'pat-bailey-rd',
    name: 'Bailey Road',
    displayName: 'Bailey Road (Jawaharlal Nehru Marg), Patna',
    subtitle: 'Near High Court, Patna Zoo & Secretariat · PIN 800001',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    latitude: 25.6090,
    longitude: 85.1050,
    type: 'road',
  },
  {
    id: 'pat-rajendra-ngr',
    name: 'Rajendra Nagar',
    displayName: 'Rajendra Nagar, Patna',
    subtitle: 'Near Rajendra Nagar Terminal & Moin-ul-Haq Stadium · PIN 800016',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800016',
    latitude: 25.5980,
    longitude: 85.1630,
    type: 'transit',
    popularLandmark: 'Rajendra Nagar Terminal',
  },
  {
    id: 'pat-danapur',
    name: 'Danapur Cantt / Station',
    displayName: 'Danapur, Patna',
    subtitle: 'Near Danapur Junction & Saguna More · PIN 801503',
    city: 'Patna',
    state: 'Bihar',
    pincode: '801503',
    latitude: 25.6320,
    longitude: 85.0450,
    type: 'transit',
  },
  {
    id: 'pat-saguna-more',
    name: 'Saguna More',
    displayName: 'Saguna More, Bailey Road, Patna',
    subtitle: 'Rapid Growing Residential Hub near Danapur · PIN 801503',
    city: 'Patna',
    state: 'Bihar',
    pincode: '801503',
    latitude: 25.6170,
    longitude: 85.0560,
    type: 'chowk',
  },
  {
    id: 'pat-ashiana',
    name: 'Ashiana Nagar',
    displayName: 'Ashiana Nagar, Patna',
    subtitle: 'Phase 1 & 2, Near Passport Office · PIN 800025',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800025',
    latitude: 25.6210,
    longitude: 85.0820,
    type: 'colony',
  },
  {
    id: 'pat-raja-bazar',
    name: 'Raja Bazar',
    displayName: 'Raja Bazar, Patna',
    subtitle: 'Near IGIMS Hospital & Flyover · PIN 800014',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800014',
    latitude: 25.6140,
    longitude: 85.0890,
    type: 'hospital',
    popularLandmark: 'IGIMS Hospital',
  },
  {
    id: 'pat-fraser-rd',
    name: 'Fraser Road',
    displayName: 'Fraser Road, Patna',
    subtitle: 'Near Dak Bungalow Chowk & Patna Junction · PIN 800001',
    city: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    latitude: 25.6070,
    longitude: 85.1380,
    type: 'commercial',
    popularLandmark: 'Dak Bungalow Chowk',
  },

  // ==========================================
  // DARBHANGA LOCALITIES & LANDMARKS
  // ==========================================
  {
    id: 'dbg-laheriasarai',
    name: 'Laheriasarai',
    displayName: 'Laheriasarai, Darbhanga',
    subtitle: 'District Headquarters & Prime Commercial Center · PIN 846001',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846001',
    latitude: 26.1240,
    longitude: 85.8970,
    type: 'commercial',
  },
  {
    id: 'dbg-dmch',
    name: 'DMCH Road (Medical College)',
    displayName: 'DMCH Campus, Darbhanga',
    subtitle: 'Near Darbhanga Medical College & Hospital · PIN 846003',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846003',
    latitude: 26.1420,
    longitude: 85.9010,
    type: 'hospital',
    popularLandmark: 'DMCH Hospital',
  },
  {
    id: 'dbg-tower-chowk',
    name: 'Tower Chowk',
    displayName: 'Tower Chowk, Darbhanga',
    subtitle: 'Main City Center & Market Hub · PIN 846004',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846004',
    latitude: 26.1550,
    longitude: 85.8950,
    type: 'chowk',
  },
  {
    id: 'dbg-donar',
    name: 'Donar Chowk',
    displayName: 'Donar, Darbhanga',
    subtitle: 'Near Bypass Highway & Student Hostels · PIN 846004',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846004',
    latitude: 26.1600,
    longitude: 85.9120,
    type: 'chowk',
  },
  {
    id: 'dbg-benta',
    name: 'Benta Chowk',
    displayName: 'Benta, Darbhanga',
    subtitle: 'Near DMCH Back Gate & Doctors Colony · PIN 846003',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846003',
    latitude: 26.1360,
    longitude: 85.9040,
    type: 'colony',
  },
  {
    id: 'dbg-allalpatti',
    name: 'Allalpatti',
    displayName: 'Allalpatti, Darbhanga',
    subtitle: 'VIP Road Area & Prominent Medical Hub · PIN 846003',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846003',
    latitude: 26.1300,
    longitude: 85.9000,
    type: 'colony',
  },
  {
    id: 'dbg-mirzapur',
    name: 'Mirzapur',
    displayName: 'Mirzapur, Darbhanga',
    subtitle: 'Near LNMU University & C.M. College · PIN 846004',
    city: 'Darbhanga',
    state: 'Bihar',
    pincode: '846004',
    latitude: 26.1480,
    longitude: 85.8890,
    type: 'college',
    popularLandmark: 'LNMU University Campus',
  },

  // ==========================================
  // MUZAFFARPUR LOCALITIES & LANDMARKS
  // ==========================================
  {
    id: 'muz-mithanpura',
    name: 'Mithanpura',
    displayName: 'Mithanpura, Muzaffarpur',
    subtitle: 'Prime Commercial & Education Area, Club Road · PIN 842002',
    city: 'Muzaffarpur',
    state: 'Bihar',
    pincode: '842002',
    latitude: 26.1150,
    longitude: 85.3920,
    type: 'commercial',
  },
  {
    id: 'muz-motijheel',
    name: 'Motijheel',
    displayName: 'Motijheel, Muzaffarpur',
    subtitle: 'Biggest Shopping & Market Center of North Bihar · PIN 842001',
    city: 'Muzaffarpur',
    state: 'Bihar',
    pincode: '842001',
    latitude: 26.1210,
    longitude: 85.3850,
    type: 'commercial',
  },
  {
    id: 'muz-gobarsahi',
    name: 'Gobarsahi Chowk',
    displayName: 'Gobarsahi, Muzaffarpur',
    subtitle: 'Near NH-28 Highway Corridor · PIN 842001',
    city: 'Muzaffarpur',
    state: 'Bihar',
    pincode: '842001',
    latitude: 26.1020,
    longitude: 85.3560,
    type: 'chowk',
  },
  {
    id: 'muz-bhagwanpur',
    name: 'Bhagwanpur Chowk',
    displayName: 'Bhagwanpur, Muzaffarpur',
    subtitle: 'Major Coaching Hub & Student PG Area · PIN 842001',
    city: 'Muzaffarpur',
    state: 'Bihar',
    pincode: '842001',
    latitude: 26.1290,
    longitude: 85.3480,
    type: 'college',
  },
];

/**
 * Instant local gazetteer search tailored to the currently selected city.
 * Matches name, subtitle, popular landmarks, and PIN codes.
 */
export function searchLocalGazetteer(query: string, cityName?: string): GazetteerPlace[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const targetCity = cityName?.toLowerCase().trim();

  return LOCAL_GAZETTEER.filter((place) => {
    // If a city is specified, restrict to that city
    if (targetCity && place.city.toLowerCase() !== targetCity) {
      return false;
    }

    const nameMatch = place.name.toLowerCase().includes(q);
    const subtitleMatch = place.subtitle.toLowerCase().includes(q);
    const pinMatch = place.pincode.includes(q);
    const landmarkMatch = place.popularLandmark?.toLowerCase().includes(q);

    return nameMatch || subtitleMatch || pinMatch || landmarkMatch;
  }).slice(0, 5);
}
