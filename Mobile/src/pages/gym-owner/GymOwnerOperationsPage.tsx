import { useState } from "react";
import { Text, View } from "react-native";
import OverviewGrid from "../../components/common/OverviewGrid";
import BarChart from "../../components/charts/BarChart";
import {
  Details,
  records,
  ResourcePage,
} from "../../components/common/ResourcePage";
import { Badge, Button, Card, Empty, SearchField } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { gymFields, planFields } from "../../constants/owner";
import { useAuth } from "../../contexts/AuthContext";
import { useForm, type FormField } from "../../contexts/FormContext";
import type { ScreenProps } from "../../routes/types";
import FitSwapPlusPage from "../billing/FitSwapPlusPage";
import OwnerTransfersPage from "./OwnerTransfersPage";
import OwnerTrialsPage from "./OwnerTrialsPage";
const sections: Record<string, { title: string; path: string }> = {
  dashboard: { title: "Your gym, in motion.", path: "/gym-owner/dashboard" },
  gyms: { title: "Your gyms", path: "/gyms/my-gyms" },
  plans: { title: "Membership plans", path: "/gyms/my-gyms" },
  members: { title: "Member directory", path: "/gym-owner/members" },
  sales: { title: "Sales & revenue", path: "/gym-owner/sales" },
  audit: { title: "Transfer audit", path: "/gym-owner/transfer-audit-logs" },
  risk: { title: "Risk alerts", path: "/gym-owner/fraud-alerts" },
};
export default function GymOwnerOperationsPage({
  route,
  navigation,
}: ScreenProps<"Owner">) {
  const section = route.params.section;
  const [search, setSearch] = useState("");
  const { call } = useAuth();
  const { openForm } = useForm();
  if (section === "billing") return <FitSwapPlusPage />;
  if (section === "trials") return <OwnerTrialsPage />;
  if (section === "transfers") return <OwnerTransfersPage />;
  const config = sections[section] || sections.dashboard;
  return (
    <ResourcePage
      title={config.title}
      subtitle="FitSwap Business"
      path={config.path}
    >
      {(data, reload) => {
        const allItems = records(data);
        const items = allItems.filter((item) =>
          `${item.name || ""} ${item.firstName || ""} ${item.lastName || ""} ${item.email || ""} ${item.status || ""} ${item.summary || ""}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        );
        const gyms = section === "plans" || section === "gyms" ? items : [];
        const editPlan = (plan?: any) =>
          openForm({
            title: plan ? "Edit membership plan" : "Create membership plan",
            initial: plan,
            fields: [
              ...(!plan
                ? [
                    {
                      key: "gymId",
                      label: "Gym",
                      type: "select",
                      required: true,
                      initial: gyms[0]?.id,
                      options: gyms.map((g) => ({
                        value: g.id,
                        label: g.name,
                      })),
                    } as FormField,
                  ]
                : []),
              ...planFields,
            ],
            onSubmit: async (body) => {
              await call(
                plan ? `/plans/${plan.id}` : `/gyms/${body.gymId}/plans`,
                { method: plan ? "PATCH" : "POST", body },
              );
              reload();
            },
          });
        return (
          <>
            {allItems.length > 0 && (
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Search this section"
              />
            )}
            {section === "gyms" && (
              <View className="mb-5">
                <Button
                  title="Add gym"
                  onPress={() =>
                    openForm({
                      title: "Create gym profile",
                      fields: gymFields,
                      onSubmit: async (body) => {
                        await call("/gyms", { method: "POST", body });
                        reload();
                      },
                    })
                  }
                />
              </View>
            )}
            {section === "plans" && (
              <View className="mb-5">
                <Button
                  title="Create membership plan"
                  disabled={!gyms.length}
                  onPress={() => editPlan()}
                />
              </View>
            )}
            {section === "gyms" ? (
              <ResponsiveGrid maxColumns={2}>
                {items.map((g) => (
                  <Card key={g.id}>
                    <Badge title={g.status} />
                    <Text className="mt-4 text-xl font-bold text-white">
                      {g.name}
                    </Text>
                    <Text className="my-4 text-sm text-muted">
                      {g.city} · {g.plans?.length || 0} plans
                    </Text>
                    <Button
                      title="Manage gym"
                      onPress={() =>
                        navigation.navigate("OwnerGym", { gymId: g.id })
                      }
                    />
                  </Card>
                ))}
              </ResponsiveGrid>
            ) : section === "plans" ? (
              <ResponsiveGrid maxColumns={2}>
                {gyms.flatMap((g) =>
                  (g.plans || []).map((p: any) => (
                    <Card key={p.id}>
                      <Text className="text-xs text-violet-400">{g.name}</Text>
                      <Text className="my-3 text-xl font-bold text-white">
                        {p.name}
                      </Text>
                      <Details data={p} />
                      <View className="mt-4">
                        <Button
                          secondary
                          title="Edit plan & transfer policy"
                          onPress={() => editPlan(p)}
                        />
                      </View>
                    </Card>
                  )),
                )}
              </ResponsiveGrid>
            ) : (
              <>
                {data.overview && <OverviewGrid data={data.overview} />}
                {data.summary && <OverviewGrid data={data.summary} />}
                {data.revenueTrend && (
                  <Card>
                    <Text className="mb-5 text-lg font-bold text-white">
                      Revenue trend
                    </Text>
                    <BarChart
                      data={data.revenueTrend}
                      labelKey="label"
                      valueKey="revenue"
                    />
                  </Card>
                )}
                {data.revenueByGym && (
                  <Card>
                    <Text className="mb-4 text-lg font-bold text-white">
                      Revenue by gym (₹)
                    </Text>
                    <BarChart
                      data={data.revenueByGym}
                      labelKey="name"
                      valueKey="revenue"
                    />
                  </Card>
                )}
                {data.revenueTrend && (
                  <Card>
                    <Text className="mb-4 text-lg font-bold text-white">
                      Sales volume
                    </Text>
                    <BarChart
                      data={data.revenueTrend}
                      labelKey="label"
                      valueKey="sales"
                    />
                  </Card>
                )}
                <ResponsiveGrid maxColumns={2}>
                  {(items.length
                    ? items
                    : records(
                        data.members ||
                          data.sales ||
                          data.recentSales ||
                          data.alerts,
                      )
                  ).map((item, i) => (
                    <Card key={item.id || i}>
                      <Text className="mb-3 text-lg font-bold text-white">
                        {item.title ||
                          item.summary ||
                          [item.user?.firstName, item.user?.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          [item.firstName, item.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          [item.member?.firstName, item.member?.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          item.plan?.name ||
                          item.gym?.name ||
                          item.action ||
                          "Activity"}
                      </Text>
                      <Details data={item} />
                      {item.user && <Details data={item.user} />}
                      {item.member && <Details data={item.member} />}
                      {item.memberships?.map((membership: any) => (
                        <View
                          key={membership.id}
                          className="mt-4 border-t border-line pt-3"
                        >
                          <Text className="mb-2 text-sm font-semibold text-white">
                            {membership.plan?.name} ·{" "}
                            {membership.plan?.gym?.name}
                          </Text>
                          <Badge title={membership.status} />
                          <Details data={membership} />
                        </View>
                      ))}
                    </Card>
                  ))}
                </ResponsiveGrid>
                {!data.overview &&
                  !data.summary &&
                  !items.length &&
                  !records(data.members || data.sales || data.recentSales)
                    .length && <Empty title="No activity to show yet" />}
              </>
            )}
            {(section === "gyms" || section === "plans") && !items.length && (
              <Empty title="Add your first gym to get started" />
            )}
          </>
        );
      }}
    </ResourcePage>
  );
}
