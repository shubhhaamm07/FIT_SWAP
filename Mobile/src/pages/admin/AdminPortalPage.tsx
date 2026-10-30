import { useState } from "react";
import { Text, View } from "react-native";
import OverviewGrid from "../../components/common/OverviewGrid";
import BarChart from "../../components/charts/BarChart";
import { Details, label, records } from "../../components/common/ResourcePage";
import {
  Badge,
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
  Section,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { selectField, textField, useForm } from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { exportCsv } from "../../utils/export";
import { download } from "../../utils/files";
import AdminNotificationCentrePage from "./AdminNotificationCentrePage";
const configs: Record<string, { title: string; path: string }> = {
  dashboard: { title: "Platform overview", path: "/admin/dashboard" },
  gyms: { title: "Gym verification", path: "/admin/pending-gyms" },
  users: { title: "People & access", path: "/admin/users" },
  listings: { title: "Marketplace moderation", path: "/admin/listings" },
  payments: { title: "Payment oversight", path: "/admin/payments" },
  analytics: { title: "Platform analytics", path: "/admin/analytics" },
  "audit-logs": { title: "Administration audit", path: "/admin/audit-logs" },
  "transfer-audit": {
    title: "Transfer audit",
    path: "/admin/transfer-audit-logs",
  },
  "fraud-alerts": { title: "Fraud & risk alerts", path: "/admin/fraud-alerts" },
  security: { title: "Platform security", path: "/admin/security-overview" },
};
function GymReviewCard({ gym, reload }: { gym: any; reload: () => void }) {
  const { call } = useAuth();
  const { openForm } = useForm();
  const { run, busy } = useAction();
  const [reviewed, setReviewed] = useState(false);
  const doc = gym.verificationDocuments?.[0];
  function decide(status: string) {
    openForm({
      title: `${status === "APPROVED" ? "Approve" : "Reject"} ${gym.name}`,
      fields: [
        textField("reviewNote", "Review note", status === "REJECTED"),
        {
          key: "checked",
          label: "I have reviewed the submitted PDF.",
          type: "switch",
          required: true,
        },
      ],
      onSubmit: async (v) => {
        await call(`/gyms/${gym.id}/status`, {
          method: "PATCH",
          body: {
            status,
            reviewNote: v.reviewNote,
            documentId: doc?.id,
            expectedUpdatedAt: gym.updatedAt,
          },
        });
        reload();
      },
    });
  }
  return (
    <Card>
      <Badge title={gym.status} />
      <Text className="my-4 text-xl font-bold text-white">{gym.name}</Text>
      <Details data={gym} omit={["updatedAt"]} />
      {gym.owner && (
        <Text className="mt-3 text-sm text-muted">
          Owner: {gym.owner.firstName} {gym.owner.lastName} · {gym.owner.email}
        </Text>
      )}
      {doc?.status === "SUBMITTED" ? (
        <>
          <View className="my-4">
            <Button
              secondary
              title={`Review ${doc.fileName}`}
              busy={busy}
              onPress={() =>
                run(async () => {
                  await download(
                    `/gyms/${gym.id}/verification-documents/${doc.id}`,
                    doc.fileName,
                  );
                  setReviewed(true);
                })
              }
            />
          </View>
          <View className="flex-row flex-wrap gap-3">
            <Button
              title="Approve gym"
              disabled={!reviewed}
              onPress={() => decide("APPROVED")}
            />
            <Button
              secondary
              title="Reject gym"
              disabled={!reviewed}
              onPress={() => decide("REJECTED")}
            />
          </View>
          {!reviewed && (
            <Text className="mt-3 text-xs text-muted">
              Download and review the PDF to enable a decision.
            </Text>
          )}
        </>
      ) : (
        <Text className="mt-4 text-sm text-amber-400">
          Waiting for a current verification document.
        </Text>
      )}
    </Card>
  );
}
export default function AdminPortalPage({ route }: ScreenProps<"Admin">) {
  const section = route.params.section;
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { call, user } = useAuth();
  const { openForm } = useForm();
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const config = configs[section] || configs.dashboard;
  const params = new URLSearchParams(filters);
  const state = useResource<any>(`${config.path}?${params}`);
  if (section === "announcements") return <AdminNotificationCentrePage />;
  const data = state.data?.data;
  const items = records(data).filter(
    (item) =>
      (!filters.search ||
        JSON.stringify(item)
          .toLowerCase()
          .includes(filters.search.toLowerCase())) &&
      (!filters.role || item.role === filters.role) &&
      (!filters.isActive || String(item.isActive) === filters.isActive),
  );
  const filter = () =>
    openForm({
      title: "Filter results",
      initial: filters,
      fields: [
        textField("search", "Search", false),
        ...(section === "users"
          ? [
              {
                key: "role",
                label: "Account role",
                type: "select" as const,
                options: [
                  { value: "", label: "All roles" },
                  ...["USER", "GYM_OWNER", "ADMIN"].map((value) => ({
                    value,
                    label: value.replace(/_/g, " "),
                  })),
                ],
              },
              {
                key: "isActive",
                label: "Access",
                type: "select" as const,
                options: [
                  { value: "", label: "All accounts" },
                  { value: "true", label: "Active" },
                  { value: "false", label: "Suspended" },
                ],
              },
            ]
          : []),
        ...(section === "analytics"
          ? [selectField("months", "History in months", ["3", "6", "12"], "6")]
          : [
              textField("status", "Status", false),
              textField("action", "Action", false),
              textField("from", "From date (YYYY-MM-DD)", false),
              textField("to", "To date (YYYY-MM-DD)", false),
            ]),
      ],
      onSubmit: async (v) => setFilters(v),
    });
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header title={config.title} subtitle="FitSwap administration" back />
      <View className="mb-5 flex-row gap-3">
        <Button secondary title="Filters" onPress={filter} />
        <Button
          secondary
          title="Export CSV"
          disabled={!data}
          busy={busy}
          onPress={() =>
            run(() =>
              exportCsv(
                `fitswap-${section}.csv`,
                items.length
                  ? items
                  : data.revenueTrend || [data.overview || data],
              ),
            )
          }
        />
      </View>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {data && (
        <>
          {data.overview && <OverviewGrid data={data.overview} />}
          {data.revenueTrend && (
            <Card>
              <Text className="mb-4 text-xl font-bold text-white">
                Revenue history
              </Text>
              <BarChart
                data={data.revenueTrend}
                labelKey="month"
                valueKey="revenue"
              />
            </Card>
          )}
          {section === "gyms" ? (
            items.map((gym) => (
              <GymReviewCard
                key={gym.id + gym.updatedAt}
                gym={gym}
                reload={state.reload}
              />
            ))
          ) : (
            <ResponsiveGrid maxColumns={2}>
              {items.map((item, index) => (
                <Card key={item.id || index}>
                  {item.status && <Badge title={item.status} />}
                  <Text className="my-3 text-lg font-bold text-white">
                    {item.title ||
                      item.summary ||
                      item.name ||
                      [item.firstName, item.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      item.membership?.plan?.gym?.name ||
                      item.action ||
                      item.paymentRef ||
                      "Record"}
                  </Text>
                  <Details data={item} paise={section === "payments"} />
                  {item.metadata && <Details data={item.metadata} />}
                  {section === "users" && (
                    <View className="mt-4 flex-row flex-wrap gap-3">
                      <Button
                        secondary
                        title="Change role"
                        disabled={item.id === user?.id}
                        onPress={() =>
                          openForm({
                            title: "Change account role",
                            initial: item,
                            fields: [
                              selectField("role", "Role", [
                                "USER",
                                "GYM_OWNER",
                                "ADMIN",
                              ]),
                            ],
                            onSubmit: async (body) => {
                              if (
                                !(await confirm(
                                  "Change this person’s role?",
                                  `${item.email} will receive ${body.role} access.`,
                                  "Change role",
                                ))
                              )
                                throw new Error("Role change cancelled.");
                              await call(`/admin/users/${item.id}/role`, {
                                method: "PATCH",
                                body,
                              });
                              state.reload();
                            },
                          })
                        }
                      />
                      <Button
                        secondary
                        title={
                          item.isActive ? "Suspend account" : "Restore access"
                        }
                        busy={busy}
                        disabled={item.id === user?.id}
                        onPress={() =>
                          run(async () => {
                            if (
                              !(await confirm(
                                item.isActive
                                  ? "Suspend this account?"
                                  : "Restore this account?",
                                item.email,
                                "Confirm access change",
                              ))
                            )
                              return;
                            await call(`/admin/users/${item.id}/access`, {
                              method: "PATCH",
                              body: { isActive: !item.isActive },
                            });
                            state.reload();
                          })
                        }
                      />
                    </View>
                  )}
                  {section === "listings" && (
                    <View className="mt-4">
                      <Button
                        secondary
                        title="Moderate listing"
                        onPress={() =>
                          openForm({
                            title: "Change listing status",
                            initial: item,
                            fields: [
                              selectField("status", "Status", [
                                "ACTIVE",
                                "PAUSED",
                                "CANCELLED",
                                "EXPIRED",
                              ]),
                            ],
                            onSubmit: async (body) => {
                              await call(`/admin/listings/${item.id}/status`, {
                                method: "PATCH",
                                body,
                              });
                              state.reload();
                            },
                          })
                        }
                      />
                    </View>
                  )}
                  {section === "payments" &&
                    item.sourcePaymentId &&
                    item.provider === "PLATFORM_UPI" &&
                    item.status === "BUYER_MARKED_PAID" && (
                      <View className="mt-4">
                        <Button
                          title="Confirm platform payment"
                          busy={busy}
                          onPress={() =>
                            run(async () => {
                              if (
                                !(await confirm(
                                  "Confirm received payment?",
                                  "Check the business bank account before confirming. This activates the purchased benefit.",
                                  "Confirm receipt",
                                ))
                              )
                                return;
                              await call(
                                `/platform-billing/admin/payments/${item.sourcePaymentId}/confirm`,
                                { method: "POST" },
                              );
                              state.reload();
                            })
                          }
                        />
                        <View className="mt-3">
                          <Button
                            secondary
                            title="Reject payment"
                            onPress={() =>
                              openForm({
                                title: "Reject platform payment",
                                fields: [textField("reason", "Reason")],
                                onSubmit: async (body) => {
                                  await call(
                                    `/platform-billing/admin/payments/${item.sourcePaymentId}/reject`,
                                    { method: "POST", body },
                                  );
                                  state.reload();
                                },
                              })
                            }
                          />
                        </View>
                      </View>
                    )}
                </Card>
              ))}
            </ResponsiveGrid>
          )}
          {!Array.isArray(data) &&
            Object.entries(data)
              .filter(
                ([key, value]) =>
                  Array.isArray(value) && key !== "revenueTrend",
              )
              .map(([key, value]) => (
                <View key={key}>
                  <Section title={label(key)} />
                  <ResponsiveGrid maxColumns={2}>
                    {(value as any[]).map((item, i) => (
                      <Card key={item.id || i}>
                        <Text className="mb-3 text-lg font-semibold text-white">
                          {item.name ||
                            item.title ||
                            item.summary ||
                            item.plan?.name ||
                            "Activity"}
                        </Text>
                        <Details data={item} />
                      </Card>
                    ))}
                  </ResponsiveGrid>
                </View>
              ))}
          {!items.length && Array.isArray(data) && (
            <Empty title="No matching records" />
          )}
        </>
      )}
    </Page>
  );
}
