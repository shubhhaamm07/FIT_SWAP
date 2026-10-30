import * as Location from "expo-location";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { GymCard } from "../../components/gyms/GymCard";
import GymMap from "../../components/gyms/GymMap";
import {
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
  SearchField,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { coordinates, distanceKm } from "../../utils/location.cjs";
export default function NearbyGymsPage({ navigation }: ScreenProps<"Nearby">) {
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState(25);
  const [selected, setSelected] = useState<any>(null);
  const { run, busy } = useAction();
  const state = useResource<any>(
    `/gyms?limit=60&search=${encodeURIComponent(search)}`,
  );
  const gyms = (state.data?.data || [])
    .map((g: any) => ({
      ...g,
      distance:
        position && coordinates(g)
          ? distanceKm(position, coordinates(g)!)
          : null,
    }))
    .filter((g: any) => !position || g.distance == null || g.distance <= radius)
    .sort(
      (a: any, b: any) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
    );
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Find your nearby fit."
        subtitle="Discover partner gyms around your routine."
        back
      />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Search gyms or city"
      />
      <View className="mb-5 flex-row flex-wrap gap-3">
        <Button
          title={position ? "Update my location" : "Use my location"}
          busy={busy}
          onPress={() =>
            run(async () => {
              const permission =
                await Location.requestForegroundPermissionsAsync();
              if (permission.status !== "granted")
                throw new Error(
                  "Location permission was not granted. You can search by city instead.",
                );
              const result = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              setPosition(result.coords);
            })
          }
        />
        {position && (
          <Button
            secondary
            title="Clear location"
            onPress={() => setPosition(null)}
          />
        )}
      </View>
      {position && (
        <View className="mb-5 flex-row flex-wrap gap-2">
          {[5, 10, 25, 50].map((r) => (
            <Button
              key={r}
              secondary={r !== radius}
              title={`${r} km`}
              onPress={() => setRadius(r)}
            />
          ))}
        </View>
      )}
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {selected && coordinates(selected) && (
        <Card>
          <GymMap {...coordinates(selected)!} />
          <Text className="my-4 text-lg font-bold text-white">
            {selected.name}
          </Text>
          <Button
            secondary
            title="Get directions"
            onPress={() =>
              run(() =>
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`,
                ),
              )
            }
          />
        </Card>
      )}
      <ResponsiveGrid maxColumns={2}>
        {gyms.map((g: any) => (
          <View key={g.id}>
            <GymCard
              gym={g}
              onPress={() => navigation.navigate("Gym", { id: g.id })}
            />
            <View className="mb-6 flex-row items-center gap-3">
              {g.distance != null && (
                <Text className="flex-1 text-sm text-muted">
                  {g.distance.toFixed(1)} km away
                </Text>
              )}
              {coordinates(g) && (
                <Button
                  secondary
                  title="Show on map"
                  onPress={() => setSelected(g)}
                />
              )}
            </View>
          </View>
        ))}
      </ResponsiveGrid>
      {!state.loading && !state.error && !gyms.length && (
        <Empty
          title="No nearby gyms found"
          body="Try a wider radius or a different city."
        />
      )}
    </Page>
  );
}
