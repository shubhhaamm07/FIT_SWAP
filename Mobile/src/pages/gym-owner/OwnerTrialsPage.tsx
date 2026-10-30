import { useState } from "react";
import { Text, View } from "react-native";
import {
  Badge,
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import {
  numberField,
  selectField,
  textField,
  useForm,
  type FormField,
} from "../../contexts/FormContext";
import { useResource } from "../../hooks/useApi";
export default function OwnerTrialsPage() {
  const [tab, setTab] = useState("slots");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { call } = useAuth();
  const { openForm } = useForm();
  const gyms = useResource<any>("/gyms/my-gyms");
  const state = useResource<any>(
    `/gym-owner/${tab === "slots" ? "trial-slots" : "trial-bookings"}?${new URLSearchParams(filters)}`,
  );
  const approved =
    gyms.data?.data?.filter((g: any) => g.status === "APPROVED") || [];
  const edit = (slot?: any) =>
    openForm({
      title: slot ? "Edit trial slot" : "Create trial slot",
      initial: slot,
      fields: [
        {
          key: "gymId",
          label: "Gym",
          type: "select",
          options: approved.map((g: any) => ({ value: g.id, label: g.name })),
          initial: approved[0]?.id,
          required: true,
        },
        { key: "startAt", label: "Starts at", type: "date", required: true },
        { key: "endAt", label: "Ends at", type: "date", required: true },
        numberField("capacity", "Capacity", 10),
        {
          key: "requiresApproval",
          label: "Require owner approval",
          type: "switch",
        },
      ],
      onSubmit: async (body) => {
        await call(`/gym-owner/trial-slots${slot ? `/${slot.id}` : ""}`, {
          method: slot ? "PATCH" : "POST",
          body,
        });
        state.reload();
      },
    });
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Trial management"
        subtitle="Welcome future members to your gym."
        back
      />
      <View className="mb-5 flex-row flex-wrap gap-3">
        <Button
          title="Slots"
          secondary={tab !== "slots"}
          onPress={() => setTab("slots")}
        />
        <Button
          title="Bookings"
          secondary={tab !== "bookings"}
          onPress={() => setTab("bookings")}
        />
        {tab === "slots" && (
          <Button
            title="Create slot"
            disabled={!approved.length}
            onPress={() => edit()}
          />
        )}
      </View>
      <View className="mb-4 flex-row flex-wrap gap-3">
        <Button
          secondary
          title="Filter trials"
          onPress={() =>
            openForm({
              title: "Filter trial activity",
              fields: [
                {
                  key: "gymId",
                  label: "Gym",
                  type: "select",
                  options: [
                    { value: "", label: "All your gyms" },
                    ...(gyms.data?.data || []).map((g: any) => ({
                      value: g.id,
                      label: g.name,
                    })),
                  ],
                },
                ...(tab === "bookings"
                  ? [
                      {
                        key: "status",
                        label: "Booking status",
                        type: "select",
                        options: [
                          "",
                          "PENDING",
                          "CONFIRMED",
                          "COMPLETED",
                          "NO_SHOW",
                          "CANCELLED",
                        ].map((value) => ({
                          value,
                          label: value || "All statuses",
                        })),
                      } as FormField,
                    ]
                  : []),
              ],
              initial: filters,
              onSubmit: async (values) => setFilters(values),
            })
          }
        />
        <Button
          secondary
          title="Clear filters"
          onPress={() => setFilters({})}
        />
      </View>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <ResponsiveGrid maxColumns={2}>
        {state.data?.data.map((item: any) => {
          const slot = item.slot || item;
          return (
            <Card key={item.id}>
              <Badge
                title={
                  item.status ||
                  (item.isActive === false ? "Inactive" : "Active")
                }
              />
              <Text className="my-4 text-lg font-bold text-white">
                {slot.gym?.name}
              </Text>
              <Text className="mb-3 text-sm text-muted">
                {new Date(slot.startAt).toLocaleString()} –{" "}
                {new Date(slot.endAt).toLocaleTimeString()}
              </Text>
              <Text className="mb-4 text-sm text-muted">
                {item.member
                  ? `${item.member.firstName} ${item.member.lastName}`
                  : `${slot.bookedCount}/${slot.capacity} booked`}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {tab === "slots" ? (
                  <>
                    <Button
                      secondary
                      title="Edit slot"
                      onPress={() => edit(item)}
                    />
                    <Button
                      secondary
                      title="Deactivate"
                      onPress={() =>
                        openForm({
                          title: "Deactivate trial slot",
                          description:
                            "Future bookings on this slot will be cancelled.",
                          fields: [textField("reason", "Reason")],
                          onSubmit: async (body) => {
                            await call(
                              `/gym-owner/trial-slots/${item.id}/deactivate`,
                              { method: "PATCH", body },
                            );
                            state.reload();
                          },
                        })
                      }
                    />
                  </>
                ) : (
                  <Button
                    secondary
                    title="Update booking status"
                    onPress={() =>
                      openForm({
                        title: "Manage trial booking",
                        initial: item,
                        fields: [
                          selectField("status", "Status", [
                            "CONFIRMED",
                            "COMPLETED",
                            "NO_SHOW",
                            "CANCELLED",
                          ]),
                          textField("reason", "Reason", false),
                        ],
                        onSubmit: async (body) => {
                          await call(
                            `/gym-owner/trial-bookings/${item.id}/status`,
                            { method: "PATCH", body },
                          );
                          state.reload();
                        },
                      })
                    }
                  />
                )}
              </View>
            </Card>
          );
        })}
      </ResponsiveGrid>
      {!state.loading && !state.error && !state.data?.data.length && (
        <Empty title="No trial activity yet" />
      )}
    </Page>
  );
}
