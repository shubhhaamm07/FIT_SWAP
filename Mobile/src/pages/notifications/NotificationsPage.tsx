import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
} from "../../components/ui/index";
import { useAuth } from "../../contexts/AuthContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { Envelope, Notice } from "../../types/domain";
import { dateLabel } from "../../utils/format.cjs";

export function NotificationsScreen() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const state = useResource<Envelope<Notice[]>>(
    `/notifications?page=${page}&limit=20`,
  );
  const { call } = useAuth();
  const { run, busy } = useAction();
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header title="Your updates" back />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <View className="mb-4 flex-row flex-wrap gap-3">
        <Button
          secondary={!unreadOnly}
          title="Unread on this page"
          onPress={() => setUnreadOnly(true)}
        />
        <Button
          secondary={unreadOnly}
          title="All updates"
          onPress={() => setUnreadOnly(false)}
        />
      </View>
      {!!state.data?.data.length && (
        <View className="mb-5">
          <Button
            title="Mark all as read"
            secondary
            busy={busy}
            onPress={() =>
              run(async () => {
                await call("/notifications/read-all", { method: "PATCH" });
                state.reload();
              })
            }
          />
        </View>
      )}
      {state.data?.data
        .filter((n) => !unreadOnly || !n.isRead)
        .map((n) => (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            accessibilityLabel={`${n.isRead ? "Read" : "Unread"}: ${n.title}`}
            disabled={busy || n.isRead}
            onPress={() =>
              run(async () => {
                await call(`/notifications/${n.id}/read`, { method: "PATCH" });
                state.reload();
              })
            }
          >
            <Card>
              {!n.isRead && (
                <View className="mb-3 h-2 w-2 rounded-full bg-lime" />
              )}
              <Text className="text-base font-bold text-white">{n.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-muted">
                {n.message}
              </Text>
              <Text className="mt-4 text-xs text-zinc-500">
                {dateLabel(n.createdAt)}
              </Text>
            </Card>
          </Pressable>
        ))}
      <View className="mt-4 flex-row flex-wrap justify-between gap-3">
        <Button
          secondary
          title="Previous"
          disabled={page === 1 || state.loading}
          onPress={() => setPage((p) => p - 1)}
        />
        <Button
          secondary
          title="Next page"
          disabled={!state.data?.pagination?.hasNextPage || state.loading}
          onPress={() => setPage((p) => p + 1)}
        />
      </View>
      {!state.loading && !state.error && !state.data?.data.length && (
        <Empty
          title="You’re all caught up"
          body="Updates about your memberships will appear here."
        />
      )}
    </Page>
  );
}
