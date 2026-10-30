import { Text, View } from "react-native";
import { Details } from "../../components/common/ResourcePage";
import {
  Badge,
  Button,
  Card,
  Header,
  LoadState,
  Page,
  Row,
} from "../../components/ui/index";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import type { Envelope, Membership } from "../../types/domain";
import { dateLabel, daysLeft } from "../../utils/format.cjs";

export function MembershipScreen({
  route,
  navigation,
}: ScreenProps<"Membership">) {
  const { call } = useAuth();
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const state = useResource<Envelope<Membership>>(
    `/memberships/${route.params.id}`,
  );
  const m = state.data?.data;
  const eligibility = useResource<any>(
    `/memberships/${route.params.id}/transfer-eligibility`,
  );
  async function toggle() {
    if (!m) return;
    const frozen = m.status === "FROZEN";
    if (
      !(await confirm(
        frozen ? "Resume membership?" : "Freeze membership?",
        frozen
          ? "Your gym access will resume according to your plan’s policy."
          : "Your gym access will pause according to your plan’s freeze policy.",
        frozen ? "Resume" : "Freeze",
      ))
    )
      return;
    await run(
      async () => {
        await call(`/memberships/${m.id}/${frozen ? "unfreeze" : "freeze"}`, {
          method: "PATCH",
        });
        state.reload();
      },
      frozen ? "Membership resumed." : "Membership frozen.",
    );
  }
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header title="Your membership" back />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {m && (
        <>
          <Card>
            <Badge title={m.status} green={m.status === "ACTIVE"} />
            <Text className="mt-6 text-3xl font-bold text-white">
              {m.plan?.gym?.name}
            </Text>
            <Text className="mb-5 mt-2 text-sm text-muted">{m.plan?.name}</Text>
            <Row label="Start date" value={dateLabel(m.startDate)} />
            <Row label="Expiry date" value={dateLabel(m.endDate)} />
            <Row
              label="Calendar days until expiry"
              value={String(daysLeft(m.endDate))}
            />
            <Row
              label="Transferable"
              value={
                m.plan?.transferable ? "Yes, subject to eligibility" : "No"
              }
            />
          </Card>
          <Card>
            <Details data={m as any} />
            <Details data={m.plan as any} omit={["id"]} />
          </Card>
          {eligibility.data && (
            <Card>
              <Text className="mb-3 text-lg font-bold text-white">
                Transfer eligibility
              </Text>
              <Text className="text-sm text-muted">
                {eligibility.data.data.eligible
                  ? "Eligible for transfer"
                  : eligibility.data.data.reasons?.join(" ")}
              </Text>
            </Card>
          )}
          {(m.status === "FROZEN" ||
            (m.status === "ACTIVE" && m.plan.freezeAllowed)) && (
            <Button
              secondary
              title={
                m.status === "FROZEN"
                  ? "Resume membership"
                  : "Freeze membership"
              }
              busy={busy}
              onPress={toggle}
            />
          )}
          {m.status === "ACTIVE" &&
            m.plan?.transferable &&
            eligibility.data?.data?.eligible && (
              <View className="mt-3">
                <Button
                  title="Sell unused membership"
                  onPress={() =>
                    navigation.navigate("Sell", { membershipId: m.id })
                  }
                />
              </View>
            )}
          <Text className="mt-5 text-sm leading-6 text-muted">
            Freeze limits and transfer eligibility are checked against your
            gym’s policy by FitSwap.
          </Text>
        </>
      )}
    </Page>
  );
}
