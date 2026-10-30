import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useState } from "react";
import { View } from "react-native";
import { GymCard } from "../../components/gyms/GymCard";
import {
  Button,
  Empty,
  Header,
  LoadState,
  Page,
  SearchField,
} from "../../components/ui/index";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useDebounced, useResource } from "../../hooks/useApi";
import type { RootStack } from "../../routes/types";
import type { Envelope, Gym } from "../../types/domain";

export function GymsScreen() {
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useDebounced(search.trim());
  const state = useResource<Envelope<Gym[]>>(
    `/gyms?limit=12&page=${page}&search=${encodeURIComponent(query)}`,
  );
  const items = state.data?.data || [];
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Find your training space"
        subtitle="New spaces. New energy. Your kind of gym."
      />
      <View className="mb-5 flex-row flex-wrap gap-3">
        <Button
          title="Nearby map"
          secondary
          onPress={() => navigation.navigate("Nearby")}
        />
        <Button
          title="Book a trial"
          onPress={() => navigation.navigate("Trials")}
        />
      </View>
      <SearchField
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by gym or city"
      />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {!state.loading &&
        !state.error &&
        (items.length ? (
          <ResponsiveGrid>
            {items.map((g) => (
              <GymCard
                key={g.id}
                gym={g}
                onPress={() => navigation.navigate("Gym", { id: g.id })}
              />
            ))}
          </ResponsiveGrid>
        ) : (
          <Empty
            title="No gyms found"
            body="Try a different name or location."
          />
        ))}
      <View className="mt-3 flex-row justify-between gap-3">
        <Button
          title="Previous"
          secondary
          disabled={page === 1 || state.loading}
          onPress={() => setPage((p) => p - 1)}
        />
        <Button
          title="Next page"
          secondary
          disabled={!state.data?.pagination?.hasNextPage || state.loading}
          onPress={() => setPage((p) => p + 1)}
        />
      </View>
    </Page>
  );
}
