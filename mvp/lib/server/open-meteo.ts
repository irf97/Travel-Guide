export type OpenMeteoWeather = {
  latitude: number;
  longitude: number;
  temperatureC: number | null;
  precipitationProbability: number | null;
  windSpeedKmh: number | null;
  comfortScore: number;
  source: "Open-Meteo";
  cachedForSeconds: number;
};

function comfortFromWeather(temp: number | null, rain: number | null, wind: number | null) {
  let score = 85;
  if (typeof temp === "number") {
    score -= Math.abs(temp - 22) * 2.1;
    if (temp > 32) score -= 12;
    if (temp < 8) score -= 10;
  }
  if (typeof rain === "number") score -= rain * 0.18;
  if (typeof wind === "number" && wind > 28) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function fetchOpenMeteoWeather(input: { latitude: number; longitude: number }): Promise<{ ok: true; data: OpenMeteoWeather } | { ok: false; error: string; fallback: OpenMeteoWeather }> {
  const { latitude, longitude } = input;
  const fallback: OpenMeteoWeather = {
    latitude,
    longitude,
    temperatureC: null,
    precipitationProbability: null,
    windSpeedKmh: null,
    comfortScore: 50,
    source: "Open-Meteo",
    cachedForSeconds: 3600
  };

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, error: "Invalid coordinates", fallback };
  }

  const base = process.env.OPEN_METEO_BASE ?? process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1";
  const url = new URL(`${base.replace(/\/$/, "")}/forecast`);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,precipitation,wind_speed_10m");
  url.searchParams.set("hourly", "precipitation_probability");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return { ok: false, error: `Open-Meteo returned ${response.status}`, fallback };
    const json = await response.json();
    const temperatureC = typeof json?.current?.temperature_2m === "number" ? json.current.temperature_2m : null;
    const windSpeedKmh = typeof json?.current?.wind_speed_10m === "number" ? json.current.wind_speed_10m : null;
    const precipitationProbability = Array.isArray(json?.hourly?.precipitation_probability) && typeof json.hourly.precipitation_probability[0] === "number" ? json.hourly.precipitation_probability[0] : null;
    return {
      ok: true,
      data: {
        latitude,
        longitude,
        temperatureC,
        precipitationProbability,
        windSpeedKmh,
        comfortScore: comfortFromWeather(temperatureC, precipitationProbability, windSpeedKmh),
        source: "Open-Meteo",
        cachedForSeconds: 3600
      }
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), fallback };
  }
}
