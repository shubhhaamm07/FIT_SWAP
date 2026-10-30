import React from "react";
export default function GymMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const bbox = [
    longitude - 0.025,
    latitude - 0.018,
    longitude + 0.025,
    latitude + 0.018,
  ].join(",");
  return React.createElement("iframe", {
    title: "Gym location on OpenStreetMap",
    src: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude},${longitude}`,
    style: { width: "100%", height: 300, border: 0, borderRadius: 20 },
  });
}
