import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ArrowUpRight } from "lucide-react-native";
import { ListingCard } from "../../components/marketplace/ListingCard";
import {
  Button,
  Empty,
  Header,
  LoadState,
  Page,
  SearchField,
} from "../../components/ui/index";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { numberField, textField, useForm } from "../../contexts/FormContext";
import { useDebounced, useResource } from "../../hooks/useApi";
import { useDeviceLocation } from "../../hooks/useDeviceLocation";
import type { RootStack } from "../../routes/types";
import type { Envelope, Listing } from "../../types/domain";
import { coordinates, distanceKm } from "../../utils/location.cjs";

export function MarketplaceScreen() {
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("recent");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { openForm } = useForm();
  const location = useDeviceLocation();
  const [radius, setRadius] = useState(25);
  const [showLocation, setShowLocation] = useState(false);
  const query = useDebounced(search.trim());
  const state = useResource<Envelope<Listing[]>>(
    `/listings?page=${page}&limit=12&search=${encodeURIComponent(query)}&sortBy=${sort === "price" ? "price-low" : sort === "price-high" ? "price-high" : sort === "remaining-days" ? "remaining-days" : "newest"}&${new URLSearchParams(filters)}`,
  );
  const items = (state.data?.data || []).filter((listing) => {
    const point = coordinates(listing.membership.plan.gym);
    return (
      !location.position ||
      (point && distanceKm(location.position, point) <= radius)
    );
  });
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Find your next fit"
        subtitle="Great gyms. Flexible memberships. A fresh start."
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose a membership to sell"
            onPress={() =>
              navigation.navigate("Main", { screen: "Memberships" })
            }
            className="ml-3 h-11 w-11 items-center justify-center rounded-2xl bg-lime"
          >
            <ArrowUpRight size={21} color="#182010" />
          </Pressable>
        }
      />
      <SearchField
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by gym or city"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {[
          { id: "recent", label: "Latest" },
          { id: "price", label: "Price: low to high" },
          { id: "price-high", label: "Price: high to low" },
          { id: "remaining-days", label: "Remaining time" },
        ].map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityState={{ selected: sort === s.id }}
            onPress={() => {
              setSort(s.id);
              setPage(1);
            }}
            className={`min-h-11 justify-center rounded-full border px-4 ${sort === s.id ? "border-violet-400 bg-violet-400/10" : "border-line bg-panel"}`}
          >
            <Text
              className={`text-xs font-semibold ${sort === s.id ? "text-violet-200" : "text-muted"}`}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className="mb-4 flex-row flex-wrap gap-2">
        <Button
          secondary
          title={
            Object.keys(filters).length
              ? `Filters (${Object.keys(filters).length})`
              : "Refine search"
          }
          onPress={() =>
            openForm({
              title: "Find your perfect fit",
              initial: filters,
              fields: [
                textField("city", "City", false),
                textField("state", "State", false),
                {
                  ...numberField("minPrice", "Minimum price in rupees"),
                  required: false,
                },
                {
                  ...numberField("maxPrice", "Maximum price in rupees"),
                  required: false,
                },
                {
                  ...numberField("duration", "Minimum remaining days"),
                  required: false,
                },
                {
                  key: "featuredOnly",
                  label: "Featured memberships only",
                  type: "switch",
                },
              ],
              onSubmit: async (v) => {
                setFilters(
                  Object.fromEntries(
                    Object.entries(v)
                      .filter(([, value]) => value != null && value !== "")
                      .map(([k, value]) => [k, String(value)]),
                  ),
                );
                setPage(1);
              },
            })
          }
        />
        <Button
          secondary
          title="Near me"
          onPress={() => setShowLocation((v) => !v)}
        />
        {(Object.keys(filters).length > 0 || search) && (
          <Button
            secondary
            title="Reset"
            onPress={() => {
              setFilters({});
              setSearch("");
              setPage(1);
            }}
          />
        )}
      </View>
      {showLocation && (
        <View className="mb-4 flex-row flex-wrap gap-2">
          <Button
            secondary
            busy={location.busy}
            title={
              location.position ? "Refresh my location" : "Nearby memberships"
            }
            onPress={location.locate}
          />
          {location.position && (
            <>
              <Button
                secondary
                title="Clear location"
                onPress={location.clear}
              />
              {[5, 10, 25, 50].map((value) => (
                <Button
                  key={value}
                  secondary={radius !== value}
                  title={`${value} km`}
                  onPress={() => setRadius(value)}
                />
              ))}
            </>
          )}
        </View>
      )}
      {location.position && (
        <Text className="mb-4 text-xs leading-5 text-muted">
          Showing memberships with coordinates within {radius} km on the current
          result page.
        </Text>
      )}
      <Text className="mb-4 text-xs font-semibold text-muted">
        {state.data?.pagination?.total ?? "—"} memberships · Page {page}
      </Text>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {!state.loading &&
        !state.error &&
        (items.length ? (
          <ResponsiveGrid>
            {items.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                onPress={() => navigation.navigate("Listing", { id: l.id })}
              />
            ))}
          </ResponsiveGrid>
        ) : (
          <Empty
            title="No matching memberships"
            body="Try another gym or city."
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
