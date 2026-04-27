"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldCity } from "@/lib/world-data";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type GlobePoint = {
  id: string;
  name: string;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  score: number;
  rank: number;
  color: string;
  altitude: number;
  radius: number;
};

type Arc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string[];
};

export function Real3DGlobe({
  cities,
  selectedId,
  onSelect
}: {
  cities: Array<{ city: WorldCity; score: number; globalRank: number }>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const globeRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 720 });

  useEffect(() => {
    function update() {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dimension = Math.max(360, Math.min(rect.width, rect.height || rect.width));
      setSize({ width: dimension, height: dimension });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
    }
    globeRef.current?.pointOfView?.({ lat: 30, lng: 18, altitude: 1.85 }, 900);
  }, []);

  useEffect(() => {
    const selected = cities.find((item) => item.city.id === selectedId);
    if (!selected) return;
    globeRef.current?.pointOfView?.({ lat: selected.city.lat, lng: selected.city.lng, altitude: 1.45 }, 900);
  }, [selectedId, cities]);

  const points = useMemo<GlobePoint[]>(() => cities.slice(0, 80).map((item) => ({
    id: item.city.id,
    name: item.city.name,
    country: item.city.country,
    continent: item.city.continent,
    lat: item.city.lat,
    lng: item.city.lng,
    score: item.score,
    rank: item.globalRank,
    color: item.city.id === selectedId ? "#bbf7d0" : item.score >= 86 ? "#22d3ee" : item.score >= 78 ? "#60a5fa" : "#a78bfa",
    altitude: item.city.id === selectedId ? 0.045 : 0.018 + item.score / 5500,
    radius: item.city.id === selectedId ? 0.55 : Math.max(0.18, item.score / 210)
  })), [cities, selectedId]);

  const arcs = useMemo<Arc[]>(() => {
    const selected = points.find((point) => point.id === selectedId) ?? points[0];
    if (!selected) return [];
    return points.slice(1, 12).map((point) => ({
      startLat: selected.lat,
      startLng: selected.lng,
      endLat: point.lat,
      endLng: point.lng,
      color: ["rgba(34,211,238,0.9)", "rgba(59,130,246,0.15)"]
    }));
  }, [points, selectedId]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", minHeight: 520, display: "grid", placeItems: "center" }}>
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#22d3ee"
        atmosphereAltitude={0.18}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="radius"
        pointResolution={18}
        labelsData={points.slice(0, 16)}
        labelLat="lat"
        labelLng="lng"
        labelAltitude={0.075}
        labelText={(point: object) => `${(point as GlobePoint).name} ${(point as GlobePoint).score}`}
        labelSize={0.78}
        labelDotRadius={0.18}
        labelColor={() => "rgba(224,251,255,0.92)"}
        labelResolution={2}
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.28}
        arcStroke={0.42}
        arcDashLength={0.36}
        arcDashGap={0.9}
        arcDashAnimateTime={2200}
        ringsData={points.filter((point) => point.id === selectedId)}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => "rgba(187,247,208,0.75)"}
        ringMaxRadius={4.8}
        ringPropagationSpeed={1.3}
        ringRepeatPeriod={900}
        onPointClick={(point: object) => onSelect((point as GlobePoint).id)}
        onLabelClick={(point: object) => onSelect((point as GlobePoint).id)}
      />
    </div>
  );
}
