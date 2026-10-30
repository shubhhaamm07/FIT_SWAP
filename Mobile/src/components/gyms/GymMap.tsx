import { WebView } from "react-native-webview";
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
  return (
    <WebView
      style={{ height: 300, flex: 0, borderRadius: 20 }}
      source={{
        uri: `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${latitude},${longitude}`,
      }}
      originWhitelist={[
        "https://www.openstreetmap.org",
        "https://*.openstreetmap.org",
      ]}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}
