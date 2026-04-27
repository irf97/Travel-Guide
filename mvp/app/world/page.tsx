import { ImmersiveWorld } from "@/components/immersive-world";
import { worldCities } from "@/lib/world-data";

export default function WorldPage() {
  return <ImmersiveWorld cities={worldCities} />;
}
