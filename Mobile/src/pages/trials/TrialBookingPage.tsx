import * as Crypto from "expo-crypto";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  Badge,
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
  SearchField,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { textField, useForm } from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
export default function TrialBookingPage() {
  const [tab, setTab] = useState("available");
  const [city, setCity] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const gyms = useResource<any>("/gyms?limit=60");
  const { call } = useAuth();
  const { confirm } = useFeedback();
  const { openForm } = useForm();
  const { run, busy } = useAction();
  const keys = useRef<Record<string, string>>({});
  const state = useResource<any>(
    tab === "available"
      ? `/trial-slots?city=${encodeURIComponent(city)}&${new URLSearchParams(filters)}`
      : "/trial-bookings/my",
  );
  const items = state.data?.data || [];
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Try your next gym."
        subtitle="Meet the space before making it your routine."
        back
      />
      <View className="mb-5 flex-row gap-3">
        <Button
          title="Available slots"
          secondary={tab !== "available"}
          onPress={() => setTab("available")}
        />
        <Button
          title="My bookings"
          secondary={tab !== "bookings"}
          onPress={() => setTab("bookings")}
        />
      </View>
      {tab === "available" && (
        <SearchField
          value={city}
          onChange={setCity}
          placeholder="Filter by city"
        />
      )}
      {tab === "available" && (
        <View className="mb-5 flex-row flex-wrap gap-3">
          <Button
            secondary
            title="Gym & date filters"
            onPress={() =>
              openForm({
                title: "Find a trial slot",
                fields: [
                  {
                    key: "gymId",
                    label: "Gym",
                    type: "select",
                    options: [
                      { value: "", label: "Any partner gym" },
                      ...(gyms.data?.data || []).map((g: any) => ({
                        value: g.id,
                        label: g.name,
                      })),
                    ],
                  },
                  { key: "date", label: "Visit date (YYYY-MM-DD)" },
                ],
                initial: filters,
                onSubmit: async (values) => {
                  const query: Record<string, string> = {};
                  if (values.gymId) query.gymId = values.gymId;
                  if (values.date) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date))
                      throw new Error("Enter a date as YYYY-MM-DD.");
                    const start = new Date(`${values.date}T00:00:00`);
                    if (Number.isNaN(start.getTime()))
                      throw new Error("Enter a valid visit date.");
                    query.from = start.toISOString();
                    const end = new Date(start);
                    end.setDate(end.getDate() + 1);
                    query.to = end.toISOString();
                  }
                  setFilters(query);
                },
              })
            }
          />
          <Button
            secondary
            title="Clear filters"
            onPress={() => {
              setFilters({});
              setCity("");
            }}
          />
        </View>
      )}
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <ResponsiveGrid maxColumns={2}>
        {items.map((item: any) => {
          const slot = item.slot || item;
          return (
            <Card key={item.id}>
              <Badge
                title={
                  item.status ||
                  (slot.requiresApproval
                    ? "Approval required"
                    : "Instant confirmation")
                }
              />
              <Text className="mt-4 text-xl font-bold text-white">
                {slot.gym?.name || "Gym trial"}
              </Text>
              <Text className="my-3 text-sm leading-6 text-muted">
                {new Date(slot.startAt).toLocaleString()} –{" "}
                {new Date(slot.endAt).toLocaleTimeString()}
              </Text>
              <Text className="mb-4 text-sm text-muted">
                {item.bookingReference ||
                  `${Math.max(0, slot.capacity - slot.bookedCount)} places available`}
              </Text>
              {tab === "available" ? (
                <Button
                  title="Book this trial"
                  busy={busy}
                  disabled={slot.bookedCount >= slot.capacity}
                  onPress={() =>
                    run(async () => {
                      if (
                        !(await confirm(
                          "Book this trial?",
                          `${slot.gym?.name} on ${new Date(slot.startAt).toLocaleString()}`,
                          "Book trial",
                        ))
                      )
                        return;
                      keys.current[item.id] ||= Crypto.randomUUID();
                      await call("/trial-bookings", {
                        method: "POST",
                        body: { slotId: slot.id },
                        key: keys.current[item.id],
                      });
                      setTab("bookings");
                    }, "Your trial is booked.")
                  }
                />
              ) : (
                ["PENDING", "CONFIRMED"].includes(item.status) && (
                  <Button
                    secondary
                    title="Cancel booking"
                    onPress={() =>
                      openForm({
                        title: "Cancel trial",
                        fields: [textField("reason", "Reason", false)],
                        onSubmit: async (body) => {
                          await call(`/trial-bookings/${item.id}/cancel`, {
                            method: "PATCH",
                            body,
                          });
                          state.reload();
                        },
                      })
                    }
                  />
                )
              )}
            </Card>
          );
        })}
      </ResponsiveGrid>
      {!state.loading && !state.error && !items.length && (
        <Empty
          title="No trials here yet"
          body="Try another location or check back for new slots."
        />
      )}
    </Page>
  );
}
