import React from "react";
import { Text, View } from "react-native";
import { useResource } from "../../hooks/useApi";
import { money } from "../../utils/format.cjs";
import { Header, LoadState, Page } from "../ui";
export type Entity = Record<string, any>;
export function records(value: any): Entity[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  for (const key of [
    "items",
    "records",
    "logs",
    "payments",
    "tickets",
    "users",
    "slots",
    "bookings",
    "alerts",
    "data",
  ])
    if (Array.isArray(value[key])) return value[key];
  return [];
}
export function label(value: string) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
export function Details({
  data,
  omit = [],
  paise = false,
}: {
  data: Entity;
  omit?: string[];
  paise?: boolean;
}) {
  return (
    <View>
      {Object.entries(data)
        .filter(
          ([key, value]) =>
            !omit.includes(key) &&
            value != null &&
            typeof value !== "object" &&
            ![
              "id",
              "userId",
              "ownerId",
              "buyerId",
              "sellerId",
              "sessionId",
            ].includes(key),
        )
        .map(([key, value]) => (
          <View
            key={key}
            className="flex-row justify-between gap-4 border-b border-line py-2.5"
          >
            <Text className="flex-1 text-xs text-muted">{label(key)}</Text>
            <Text selectable className="flex-1 text-right text-sm text-white">
              {typeof value === "boolean"
                ? value
                  ? "Yes"
                  : "No"
                : /(price|amount|revenue|fee|saleValue)$/i.test(key) &&
                    Number.isFinite(Number(value))
                  ? money(Number(value) / (paise && key === "amount" ? 100 : 1))
                  : /(At|Date|On)$/.test(key) &&
                      typeof value === "string" &&
                      !Number.isNaN(Date.parse(value))
                    ? new Date(value).toLocaleString()
                    : String(value)}
            </Text>
          </View>
        ))}
    </View>
  );
}
export function ResourcePage({
  title,
  subtitle,
  path,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  path: string;
  action?: React.ReactNode;
  children: (data: Entity, reload: () => void) => React.ReactNode;
}) {
  const state = useResource<any>(path);
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header title={title} subtitle={subtitle} back action={action} />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {state.data && children(state.data.data ?? state.data, state.reload)}
    </Page>
  );
}
