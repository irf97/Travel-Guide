import type { WorldCity } from "./world-data";

const flags: Record<string, string> = {
  Spain: "🇪🇸", Portugal: "🇵🇹", Italy: "🇮🇹", France: "🇫🇷", Netherlands: "🇳🇱", Germany: "🇩🇪", Austria: "🇦🇹", Denmark: "🇩🇰", Sweden: "🇸🇪", Ireland: "🇮🇪", Croatia: "🇭🇷", Greece: "🇬🇷", Türkiye: "🇹🇷", Turkey: "🇹🇷", Czechia: "🇨🇿", Hungary: "🇭🇺", Poland: "🇵🇱", Slovenia: "🇸🇮", Serbia: "🇷🇸", Bulgaria: "🇧🇬", Georgia: "🇬🇪", Morocco: "🇲🇦", Thailand: "🇹🇭", Japan: "🇯🇵", "South Korea": "🇰🇷", Singapore: "🇸🇬", Malaysia: "🇲🇾", Indonesia: "🇮🇩", Vietnam: "🇻🇳", Mexico: "🇲🇽", "United States": "🇺🇸", Canada: "🇨🇦", Brazil: "🇧🇷", Argentina: "🇦🇷", Colombia: "🇨🇴", Peru: "🇵🇪", Chile: "🇨🇱", Uruguay: "🇺🇾", Australia: "🇦🇺", "New Zealand": "🇳🇿", UAE: "🇦🇪", Egypt: "🇪🇬", Tunisia: "🇹🇳", India: "🇮🇳"
};

const countrySymbols: Record<string, string> = {
  Spain: "Gaudí mosaic", Portugal: "azulejo tile", Italy: "Renaissance piazza", France: "café terrace", Netherlands: "canal house", Germany: "Bauhaus grid", Austria: "imperial concert hall", Denmark: "harbor lights", Sweden: "Nordic archipelago", Ireland: "Celtic knot", Croatia: "Adriatic stone", Greece: "olive branch", Türkiye: "tulip motif", Turkey: "tulip motif", Czechia: "Bohemian tower", Hungary: "thermal bath", Poland: "market square", Slovenia: "alpine lake", Serbia: "fortress river", Bulgaria: "rose valley", Georgia: "wine qvevri", Morocco: "zellige pattern", Thailand: "temple spire", Japan: "torii gate", "South Korea": "hanok roof", Singapore: "garden skyline", Malaysia: "night-market lantern", Indonesia: "volcanic temple", Vietnam: "lantern street", Mexico: "talavera tile", "United States": "neon grid", Canada: "maple skyline", Brazil: "samba wave", Argentina: "tango street", Colombia: "Andean color", Peru: "Inca stone", Chile: "Pacific ridge", Uruguay: "rambla sunset", Australia: "coastal opera curve", "New Zealand": "fern coast", UAE: "desert skyline", Egypt: "Nile stone", Tunisia: "medina arch", India: "stepwell geometry"
};

export function getCityVisuals(city: WorldCity) {
  const flag = flags[city.country] ?? "🏳️";
  const symbol = countrySymbols[city.country] ?? `${city.country} cultural symbol`;
  const architecture = city.history_score > 88 ? `${city.name} old-city architecture` : city.mobility_score > 84 ? `${city.name} modern urban core` : `${city.name} landmark district`;
  const nature = city.sea_access ? `${city.name} coastline / waterfront` : city.lat > 45 ? `${city.name} parks and rivers` : `${city.name} hills, gardens, and viewpoints`;
  const cityScene = city.types.includes("nightlife") ? `${city.name} night streets` : city.types.includes("food") ? `${city.name} food quarter` : `${city.name} city center`;
  return {
    flag,
    symbol,
    architecture,
    nature,
    cityScene,
    slides: [
      { kind: "flag", title: `${city.country} flag`, label: flag, caption: "Country identity marker" },
      { kind: "symbol", title: symbol, label: "✦", caption: "Important cultural symbol" },
      { kind: "architecture", title: architecture, label: "🏛", caption: "Built-environment anchor" },
      { kind: "nature", title: nature, label: city.sea_access ? "🌊" : "🌿", caption: "Nature / outdoor context" },
      { kind: "city", title: cityScene, label: "🌆", caption: "Urban/social scene image slot" }
    ]
  };
}
