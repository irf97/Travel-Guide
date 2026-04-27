import type { City } from "./types";

export type Continent = "Europe" | "Asia" | "Africa" | "North America" | "South America" | "Oceania";

export type WorldCity = City & {
  continent: Continent;
  lat: number;
  lng: number;
};

const season = { May: 84, June: 86, July: 82, August: 80, September: 88, October: 84 };
const crowd = { May: 55, June: 68, July: 82, August: 86, September: 70, October: 58 };

type RawWorldCity = [string, string, Continent, number, number, number, number, number, number, number, number, boolean, string[]];

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function city(input: RawWorldCity): WorldCity {
  const [name, country, continent, lat, lng, cost, social, nightlife, history, food, mobility, sea, neighborhoods] = input;
  return {
    id: slug(`${name}-${country}`),
    name,
    country,
    continent,
    lat,
    lng,
    types: [sea ? "sea" : "city", history > 84 ? "historic" : "urban", nightlife > 84 ? "nightlife" : "balanced", food > 84 ? "food" : "general"],
    base_cost_per_person: cost,
    average_daily_cost: Math.round(cost / 14),
    social_density_score: social,
    nightlife_score: nightlife,
    history_score: history,
    food_culture_score: food,
    mobility_score: mobility,
    sea_access: sea,
    crowd_pressure_by_month: crowd,
    seasonality_by_month: season,
    best_neighborhoods: neighborhoods,
    risk_flags: [cost > 1300 ? "premium pricing" : cost < 650 ? "budget infrastructure varies" : "check seasonality", nightlife < 65 ? "lower nightlife density" : "nightlife concentration varies"],
    nationality_mix_context: `${name} has a mix of locals, regional travelers, international visitors, students/remote workers depending on season, and event-driven peaks. Data is seed-estimated for MVP ranking only.`,
    notes: `${name} is seeded as a ${continent} destination candidate with social, culture, food, mobility, and cost signals for the ranking engine.`
  };
}

const rawCities: RawWorldCity[] = [
  ["Valencia", "Spain", "Europe", 39.47, -0.38, 760, 92, 88, 86, 84, 88, true, ["Ruzafa", "El Carmen", "Cabanyal"]],
  ["Barcelona", "Spain", "Europe", 41.39, 2.17, 1040, 95, 94, 91, 88, 86, true, ["Gothic Quarter", "El Born", "Gracia"]],
  ["Lisbon", "Portugal", "Europe", 38.72, -9.14, 850, 94, 91, 92, 82, 80, true, ["Bairro Alto", "Cais do Sodre", "Alfama"]],
  ["Porto", "Portugal", "Europe", 41.15, -8.61, 720, 82, 78, 91, 84, 82, true, ["Ribeira", "Baixa", "Cedofeita"]],
  ["Málaga", "Spain", "Europe", 36.72, -4.42, 790, 88, 87, 88, 86, 86, true, ["Centro", "Soho", "Pedregalejo"]],
  ["Palermo", "Italy", "Europe", 38.12, 13.36, 710, 72, 74, 94, 92, 66, true, ["Kalsa", "Vucciria", "Mondello"]],
  ["Catania", "Italy", "Europe", 37.51, 15.08, 700, 76, 78, 88, 91, 68, true, ["Centro", "San Berillo", "Ognina"]],
  ["Naples", "Italy", "Europe", 40.85, 14.27, 760, 82, 80, 95, 94, 70, true, ["Centro Storico", "Chiaia", "Vomero"]],
  ["Athens", "Greece", "Europe", 37.98, 23.73, 760, 84, 86, 98, 86, 72, true, ["Psiri", "Koukaki", "Plaka"]],
  ["Thessaloniki", "Greece", "Europe", 40.64, 22.94, 690, 82, 84, 86, 84, 76, true, ["Ladadika", "Ano Poli", "Waterfront"]],
  ["Split", "Croatia", "Europe", 43.51, 16.44, 790, 83, 80, 94, 78, 72, true, ["Old Town", "Bacvice", "Znjan"]],
  ["Zadar", "Croatia", "Europe", 44.12, 15.23, 700, 72, 68, 88, 74, 70, true, ["Old Town", "Borik", "Kolovare"]],
  ["Dubrovnik", "Croatia", "Europe", 42.65, 18.09, 1050, 78, 76, 96, 78, 64, true, ["Old Town", "Lapad", "Ploce"]],
  ["Amsterdam", "Netherlands", "Europe", 52.37, 4.9, 1180, 92, 90, 88, 80, 92, false, ["De Pijp", "Jordaan", "Noord"]],
  ["Berlin", "Germany", "Europe", 52.52, 13.4, 940, 95, 96, 86, 82, 88, false, ["Kreuzberg", "Neukolln", "Friedrichshain"]],
  ["Prague", "Czechia", "Europe", 50.08, 14.44, 760, 86, 88, 94, 78, 84, false, ["Old Town", "Vinohrady", "Zizkov"]],
  ["Budapest", "Hungary", "Europe", 47.5, 19.04, 690, 86, 88, 90, 80, 80, false, ["Jewish Quarter", "District V", "Buda"]],
  ["Vienna", "Austria", "Europe", 48.21, 16.37, 980, 78, 74, 96, 84, 92, false, ["Neubau", "Innere Stadt", "Leopoldstadt"]],
  ["Paris", "France", "Europe", 48.86, 2.35, 1300, 90, 88, 98, 94, 88, false, ["Marais", "Canal Saint-Martin", "Latin Quarter"]],
  ["London", "United Kingdom", "Europe", 51.51, -0.13, 1450, 94, 92, 92, 88, 86, false, ["Shoreditch", "Soho", "Camden"]],
  ["Dublin", "Ireland", "Europe", 53.35, -6.26, 1180, 86, 84, 84, 76, 78, true, ["Temple Bar", "Portobello", "Smithfield"]],
  ["Copenhagen", "Denmark", "Europe", 55.68, 12.57, 1320, 82, 78, 86, 86, 94, true, ["Vesterbro", "Norrebro", "Nyhavn"]],
  ["Stockholm", "Sweden", "Europe", 59.33, 18.07, 1260, 80, 76, 88, 84, 92, true, ["Sodermalm", "Gamla Stan", "Ostermalm"]],
  ["Krakow", "Poland", "Europe", 50.06, 19.94, 620, 82, 84, 92, 78, 82, false, ["Kazimierz", "Old Town", "Podgorze"]],
  ["Warsaw", "Poland", "Europe", 52.23, 21.01, 680, 78, 80, 78, 76, 86, false, ["Srodmiescie", "Praga", "Powisle"]],
  ["Istanbul", "Türkiye", "Europe", 41.01, 28.98, 720, 92, 88, 98, 94, 72, true, ["Karakoy", "Kadikoy", "Beyoglu"]],
  ["Bodrum", "Türkiye", "Europe", 37.04, 27.43, 790, 82, 86, 78, 82, 68, true, ["Marina", "Gumbet", "Yalikavak"]],
  ["Marseille", "France", "Europe", 43.3, 5.37, 840, 78, 76, 86, 88, 74, true, ["Vieux-Port", "Cours Julien", "Le Panier"]],
  ["Nice", "France", "Europe", 43.71, 7.26, 980, 78, 76, 84, 82, 80, true, ["Old Nice", "Port", "Jean-Medecin"]],
  ["Ljubljana", "Slovenia", "Europe", 46.05, 14.51, 700, 72, 68, 84, 76, 88, false, ["Old Town", "Metelkova", "Trnovo"]],

  ["Bangkok", "Thailand", "Asia", 13.76, 100.5, 720, 94, 92, 82, 94, 70, false, ["Sukhumvit", "Ari", "Old Town"]],
  ["Chiang Mai", "Thailand", "Asia", 18.79, 98.99, 560, 86, 70, 82, 86, 72, false, ["Nimman", "Old City", "Santitham"]],
  ["Tokyo", "Japan", "Asia", 35.68, 139.65, 1350, 90, 88, 88, 96, 96, true, ["Shibuya", "Shimokitazawa", "Shinjuku"]],
  ["Osaka", "Japan", "Asia", 34.69, 135.5, 1080, 88, 86, 84, 96, 92, true, ["Namba", "Umeda", "Shinsekai"]],
  ["Seoul", "South Korea", "Asia", 37.57, 126.98, 1040, 92, 94, 84, 90, 92, false, ["Hongdae", "Itaewon", "Seongsu"]],
  ["Busan", "South Korea", "Asia", 35.18, 129.08, 900, 84, 82, 78, 88, 84, true, ["Haeundae", "Seomyeon", "Gwangalli"]],
  ["Taipei", "Taiwan", "Asia", 25.03, 121.57, 840, 84, 78, 82, 92, 90, true, ["Ximending", "Da'an", "Zhongshan"]],
  ["Singapore", "Singapore", "Asia", 1.35, 103.82, 1500, 86, 84, 76, 90, 96, true, ["Tiong Bahru", "Chinatown", "Marina Bay"]],
  ["Kuala Lumpur", "Malaysia", "Asia", 3.14, 101.69, 650, 84, 82, 76, 88, 78, false, ["Bukit Bintang", "Bangsar", "Chinatown"]],
  ["Penang", "Malaysia", "Asia", 5.41, 100.33, 580, 78, 70, 88, 94, 70, true, ["George Town", "Gurney", "Batu Ferringhi"]],
  ["Bali", "Indonesia", "Asia", -8.34, 115.09, 780, 92, 82, 78, 86, 60, true, ["Canggu", "Ubud", "Seminyak"]],
  ["Ho Chi Minh City", "Vietnam", "Asia", 10.82, 106.63, 560, 86, 84, 78, 90, 64, false, ["District 1", "Thao Dien", "District 3"]],
  ["Hanoi", "Vietnam", "Asia", 21.03, 105.85, 540, 80, 76, 88, 90, 62, false, ["Old Quarter", "Tay Ho", "Ba Dinh"]],
  ["Da Nang", "Vietnam", "Asia", 16.05, 108.2, 560, 76, 72, 76, 84, 68, true, ["My Khe", "An Thuong", "Hai Chau"]],
  ["Hong Kong", "Hong Kong", "Asia", 22.32, 114.17, 1280, 88, 88, 82, 90, 94, true, ["Central", "Sheung Wan", "Tsim Sha Tsui"]],
  ["Dubai", "UAE", "Asia", 25.2, 55.27, 1400, 86, 86, 70, 82, 88, true, ["Dubai Marina", "JBR", "Downtown"]],
  ["Tel Aviv", "Israel", "Asia", 32.08, 34.78, 1350, 88, 90, 76, 86, 82, true, ["Florentin", "Jaffa", "Rothschild"]],
  ["Goa", "India", "Asia", 15.49, 73.82, 620, 82, 80, 72, 84, 54, true, ["Anjuna", "Panaji", "Palolem"]],
  ["Mumbai", "India", "Asia", 19.08, 72.88, 780, 86, 84, 80, 90, 60, true, ["Bandra", "Colaba", "Lower Parel"]],
  ["Jaipur", "India", "Asia", 26.91, 75.79, 540, 70, 62, 94, 84, 56, false, ["Pink City", "C-Scheme", "Civil Lines"]],
  ["Kathmandu", "Nepal", "Asia", 27.72, 85.32, 520, 74, 68, 86, 76, 50, false, ["Thamel", "Patan", "Boudha"]],
  ["Colombo", "Sri Lanka", "Asia", 6.93, 79.86, 590, 74, 68, 78, 84, 60, true, ["Fort", "Colpetty", "Mount Lavinia"]],
  ["Phuket", "Thailand", "Asia", 7.88, 98.39, 760, 86, 86, 68, 84, 58, true, ["Patong", "Old Town", "Kata"]],
  ["Manila", "Philippines", "Asia", 14.6, 120.98, 620, 82, 84, 74, 82, 54, true, ["Makati", "BGC", "Poblacion"]],
  ["Cebu", "Philippines", "Asia", 10.32, 123.89, 580, 78, 76, 70, 80, 56, true, ["IT Park", "Mactan", "Lahug"]],

  ["Cape Town", "South Africa", "Africa", -33.92, 18.42, 850, 90, 86, 82, 88, 70, true, ["Sea Point", "Gardens", "Woodstock"]],
  ["Marrakech", "Morocco", "Africa", 31.63, -7.99, 650, 78, 70, 94, 86, 58, false, ["Medina", "Gueliz", "Hivernage"]],
  ["Essaouira", "Morocco", "Africa", 31.51, -9.77, 560, 68, 58, 84, 82, 60, true, ["Medina", "Beachfront", "Mellah"]],
  ["Casablanca", "Morocco", "Africa", 33.57, -7.59, 680, 78, 76, 76, 82, 70, true, ["Maarif", "Anfa", "Corniche"]],
  ["Cairo", "Egypt", "Africa", 30.04, 31.24, 560, 78, 72, 98, 82, 48, false, ["Zamalek", "Downtown", "Maadi"]],
  ["Alexandria", "Egypt", "Africa", 31.2, 29.92, 520, 70, 60, 88, 80, 54, true, ["Corniche", "Stanley", "Mansheya"]],
  ["Tunis", "Tunisia", "Africa", 36.81, 10.18, 520, 70, 62, 86, 78, 62, true, ["Medina", "La Marsa", "Sidi Bou Said"]],
  ["Dakar", "Senegal", "Africa", 14.69, -17.45, 650, 78, 76, 72, 82, 58, true, ["Plateau", "Almadies", "Ngor"]],
  ["Accra", "Ghana", "Africa", 5.56, -0.2, 700, 82, 80, 70, 82, 58, true, ["Osu", "Labone", "Cantonments"]],
  ["Lagos", "Nigeria", "Africa", 6.52, 3.38, 760, 88, 86, 68, 84, 46, true, ["Victoria Island", "Lekki", "Ikoyi"]],
  ["Nairobi", "Kenya", "Africa", -1.29, 36.82, 690, 82, 78, 70, 82, 56, false, ["Westlands", "Kilimani", "Karen"]],
  ["Zanzibar", "Tanzania", "Africa", -6.16, 39.2, 700, 72, 68, 82, 84, 48, true, ["Stone Town", "Nungwi", "Paje"]],
  ["Addis Ababa", "Ethiopia", "Africa", 8.98, 38.76, 560, 68, 62, 78, 82, 50, false, ["Bole", "Piazza", "Kazanchis"]],
  ["Kigali", "Rwanda", "Africa", -1.95, 30.06, 650, 66, 56, 68, 74, 70, false, ["Kiyovu", "Kimironko", "Nyamirambo"]],
  ["Windhoek", "Namibia", "Africa", -22.56, 17.08, 700, 58, 50, 62, 70, 56, false, ["City Centre", "Klein Windhoek", "Eros"]],
  ["Maputo", "Mozambique", "Africa", -25.97, 32.58, 650, 70, 68, 68, 82, 52, true, ["Polana", "Baixa", "Costa do Sol"]],
  ["Mauritius", "Mauritius", "Africa", -20.16, 57.5, 980, 70, 64, 70, 82, 58, true, ["Grand Baie", "Flic en Flac", "Port Louis"]],
  ["Seychelles", "Seychelles", "Africa", -4.68, 55.49, 1350, 58, 48, 64, 80, 44, true, ["Victoria", "Beau Vallon", "Anse Royale"]],

  ["New York", "United States", "North America", 40.71, -74.01, 1600, 96, 96, 90, 94, 94, true, ["Lower East Side", "Williamsburg", "East Village"]],
  ["Los Angeles", "United States", "North America", 34.05, -118.24, 1500, 90, 90, 78, 90, 58, true, ["Silver Lake", "Venice", "West Hollywood"]],
  ["Miami", "United States", "North America", 25.76, -80.19, 1400, 92, 94, 74, 88, 62, true, ["Wynwood", "South Beach", "Brickell"]],
  ["San Francisco", "United States", "North America", 37.77, -122.42, 1550, 86, 78, 82, 90, 82, true, ["Mission", "Hayes Valley", "North Beach"]],
  ["Austin", "United States", "North America", 30.27, -97.74, 1150, 88, 88, 72, 86, 62, false, ["East Austin", "Downtown", "South Congress"]],
  ["New Orleans", "United States", "North America", 29.95, -90.07, 980, 86, 92, 88, 92, 60, true, ["French Quarter", "Marigny", "Bywater"]],
  ["Chicago", "United States", "North America", 41.88, -87.63, 1180, 86, 84, 84, 90, 86, true, ["Wicker Park", "Logan Square", "River North"]],
  ["Seattle", "United States", "North America", 47.61, -122.33, 1280, 80, 76, 76, 88, 82, true, ["Capitol Hill", "Ballard", "Fremont"]],
  ["Vancouver", "Canada", "North America", 49.28, -123.12, 1250, 82, 78, 76, 88, 86, true, ["Gastown", "Kitsilano", "Mount Pleasant"]],
  ["Toronto", "Canada", "North America", 43.65, -79.38, 1200, 90, 86, 78, 90, 88, true, ["Queen West", "Kensington", "Ossington"]],
  ["Montreal", "Canada", "North America", 45.5, -73.57, 950, 88, 90, 86, 88, 84, false, ["Plateau", "Mile End", "Old Montreal"]],
  ["Mexico City", "Mexico", "North America", 19.43, -99.13, 720, 92, 90, 92, 96, 76, false, ["Roma Norte", "Condesa", "Coyoacan"]],
  ["Oaxaca", "Mexico", "North America", 17.07, -96.72, 560, 74, 68, 90, 96, 58, false, ["Centro", "Jalatlaco", "Xochimilco"]],
  ["Guadalajara", "Mexico", "North America", 20.67, -103.35, 610, 80, 82, 82, 88, 70, false, ["Americana", "Centro", "Chapultepec"]],
  ["Puerto Vallarta", "Mexico", "North America", 20.65, -105.23, 760, 82, 84, 72, 84, 60, true, ["Zona Romantica", "Marina", "Centro"]],
  ["Tulum", "Mexico", "North America", 20.21, -87.46, 980, 86, 86, 76, 82, 44, true, ["Beach Road", "Centro", "La Veleta"]],
  ["Havana", "Cuba", "North America", 23.11, -82.37, 620, 78, 78, 94, 80, 52, true, ["Old Havana", "Vedado", "Centro Habana"]],
  ["San Juan", "Puerto Rico", "North America", 18.47, -66.11, 940, 82, 84, 88, 84, 64, true, ["Old San Juan", "Condado", "Santurce"]],
  ["Panama City", "Panama", "North America", 8.98, -79.52, 780, 78, 78, 76, 82, 70, true, ["Casco Viejo", "El Cangrejo", "Marbella"]],
  ["San José", "Costa Rica", "North America", 9.93, -84.08, 700, 72, 70, 68, 78, 64, false, ["Escazu", "Barrio Escalante", "Amón"]],

  ["Buenos Aires", "Argentina", "South America", -34.6, -58.38, 660, 92, 90, 90, 92, 82, true, ["Palermo", "San Telmo", "Recoleta"]],
  ["Rio de Janeiro", "Brazil", "South America", -22.91, -43.17, 790, 94, 92, 82, 88, 58, true, ["Ipanema", "Botafogo", "Lapa"]],
  ["São Paulo", "Brazil", "South America", -23.55, -46.63, 760, 90, 88, 78, 92, 68, false, ["Vila Madalena", "Pinheiros", "Jardins"]],
  ["Florianópolis", "Brazil", "South America", -27.59, -48.55, 720, 86, 82, 70, 84, 54, true, ["Lagoa", "Centro", "Campeche"]],
  ["Medellín", "Colombia", "South America", 6.25, -75.56, 620, 90, 88, 76, 86, 70, false, ["El Poblado", "Laureles", "Envigado"]],
  ["Bogotá", "Colombia", "South America", 4.71, -74.07, 610, 82, 80, 84, 86, 68, false, ["Chapinero", "La Candelaria", "Zona T"]],
  ["Cartagena", "Colombia", "South America", 10.39, -75.48, 760, 86, 84, 92, 86, 54, true, ["Walled City", "Getsemani", "Bocagrande"]],
  ["Lima", "Peru", "South America", -12.05, -77.04, 690, 80, 78, 86, 96, 64, true, ["Miraflores", "Barranco", "San Isidro"]],
  ["Cusco", "Peru", "South America", -13.53, -71.97, 620, 72, 66, 96, 82, 48, false, ["Centro", "San Blas", "Wanchaq"]],
  ["Santiago", "Chile", "South America", -33.45, -70.67, 760, 78, 78, 78, 84, 76, false, ["Bellavista", "Lastarria", "Providencia"]],
  ["Valparaíso", "Chile", "South America", -33.05, -71.62, 620, 70, 68, 88, 78, 52, true, ["Cerro Alegre", "Cerro Concepcion", "El Plan"]],
  ["Montevideo", "Uruguay", "South America", -34.9, -56.16, 820, 70, 66, 78, 82, 72, true, ["Ciudad Vieja", "Pocitos", "Cordón"]],
  ["Punta del Este", "Uruguay", "South America", -34.96, -54.95, 980, 72, 76, 66, 78, 58, true, ["La Barra", "Peninsula", "Manantiales"]],
  ["Quito", "Ecuador", "South America", -0.18, -78.47, 560, 70, 64, 92, 78, 58, false, ["La Floresta", "Centro Historico", "Mariscal"]],
  ["Guayaquil", "Ecuador", "South America", -2.17, -79.9, 580, 70, 68, 70, 78, 54, true, ["Urdesa", "Las Penas", "Samborondon"]],

  ["Sydney", "Australia", "Oceania", -33.87, 151.21, 1450, 90, 88, 78, 90, 86, true, ["Surry Hills", "Newtown", "Bondi"]],
  ["Melbourne", "Australia", "Oceania", -37.81, 144.96, 1350, 90, 88, 82, 94, 88, true, ["Fitzroy", "Collingwood", "St Kilda"]],
  ["Brisbane", "Australia", "Oceania", -27.47, 153.03, 1180, 80, 78, 70, 84, 80, true, ["Fortitude Valley", "West End", "South Bank"]],
  ["Perth", "Australia", "Oceania", -31.95, 115.86, 1260, 72, 70, 68, 82, 76, true, ["Northbridge", "Fremantle", "Leederville"]],
  ["Auckland", "New Zealand", "Oceania", -36.85, 174.76, 1280, 80, 76, 72, 84, 78, true, ["Ponsonby", "Britomart", "Karangahape Road"]],
  ["Wellington", "New Zealand", "Oceania", -41.29, 174.78, 1120, 76, 74, 78, 86, 82, true, ["Te Aro", "Cuba Street", "Waterfront"]],
  ["Queenstown", "New Zealand", "Oceania", -45.03, 168.66, 1250, 72, 74, 64, 78, 50, false, ["Town Centre", "Frankton", "Fernhill"]],
  ["Honolulu", "United States", "Oceania", 21.31, -157.86, 1500, 78, 76, 72, 82, 62, true, ["Waikiki", "Kakaako", "Ala Moana"]],
  ["Fiji", "Fiji", "Oceania", -17.71, 178.07, 1120, 66, 60, 64, 78, 42, true, ["Nadi", "Denarau", "Suva"]],
  ["Bora Bora", "French Polynesia", "Oceania", -16.5, -151.74, 2200, 48, 38, 52, 76, 34, true, ["Vaitape", "Matira", "Lagoon"]]
];

export const worldCities: WorldCity[] = rawCities.map(city);

export const continents: Continent[] = ["Europe", "Asia", "Africa", "North America", "South America", "Oceania"];
