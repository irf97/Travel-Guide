import { WorldIntelligenceApp } from "@/components/world-intelligence";
import { worldCities } from "@/lib/world-data";

export default function WorldPage() {
  return <WorldIntelligenceApp cities={worldCities} />;
}
