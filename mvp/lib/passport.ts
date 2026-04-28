import type { WorldCity } from "./world-data";

const schengen = new Set(["Spain", "Portugal", "Italy", "France", "Netherlands", "Germany", "Austria", "Denmark", "Sweden", "Ireland", "Croatia", "Greece", "Czechia", "Hungary", "Poland", "Slovenia"]);
const eu = new Set([...schengen, "Bulgaria"]);

export type PassportProfile = "any" | "eu" | "uk" | "us-canada" | "turkish" | "visa-flexible";

export function passportFit(city: WorldCity, profile: PassportProfile) {
  if (profile === "any") return { score: 100, label: "No passport filter" };
  if (profile === "eu") return { score: eu.has(city.country) ? 100 : schengen.has(city.country) ? 95 : 62, label: eu.has(city.country) ? "EU easy" : "Check entry rules" };
  if (profile === "uk") return { score: schengen.has(city.country) ? 88 : ["Türkiye", "Turkey", "Georgia", "Morocco", "Serbia"].includes(city.country) ? 82 : 72, label: "UK passport estimate" };
  if (profile === "us-canada") return { score: ["United States", "Canada"].includes(city.country) ? 100 : schengen.has(city.country) ? 86 : 76, label: "US/Canada passport estimate" };
  if (profile === "turkish") return { score: ["Türkiye", "Turkey", "Georgia", "Serbia", "Morocco"].includes(city.country) ? 96 : schengen.has(city.country) ? 55 : 72, label: "Turkish passport estimate" };
  return { score: 78, label: "Visa flexible" };
}
