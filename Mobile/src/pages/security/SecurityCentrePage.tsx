import { Text, View } from "react-native";
import { Details, ResourcePage } from "../../components/common/ResourcePage";
import { Button, Card, Section } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction } from "../../hooks/useApi";
export default function SecurityCentrePage() {
  const { call } = useAuth();
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  return (
    <ResourcePage
      title="Security centre"
      subtitle="Your devices, sign-ins, and account protection."
      path="/security/overview"
    >
      {(data, reload) => (
        <>
          <Button
            secondary
            title="Sign out other devices"
            busy={busy}
            onPress={() =>
              run(async () => {
                if (
                  !(await confirm(
                    "Sign out other devices?",
                    "All sessions except this one will be revoked.",
                    "Sign out devices",
                  ))
                )
                  return;
                await call("/security/sessions/revoke-others", {
                  method: "POST",
                });
                reload();
              })
            }
          />
          <Section title="Active sessions" />
          <ResponsiveGrid maxColumns={2}>
            {data.sessions?.map((s: any) => (
              <Card key={s.id}>
                <Text className="mb-3 text-lg font-bold text-white">
                  {s.deviceName || "Device"}
                  {s.isCurrent ? " · This device" : ""}
                </Text>
                <Details data={s} />
                {!s.isCurrent && (
                  <View className="mt-4">
                    <Button
                      secondary
                      busy={busy}
                      title="Revoke session"
                      onPress={() =>
                        run(async () => {
                          if (
                            !(await confirm(
                              "Revoke this session?",
                              "This device will lose access immediately.",
                              "Revoke session",
                            ))
                          )
                            return;
                          await call(`/security/sessions/${s.id}/revoke`, {
                            method: "POST",
                          });
                          reload();
                        })
                      }
                    />
                  </View>
                )}
              </Card>
            ))}
          </ResponsiveGrid>
          <Section title="Login activity" />
          {data.loginHistory?.map((h: any) => (
            <Card key={h.id}>
              <Details data={h} />
            </Card>
          ))}
          <Section title="Password history" />
          {data.passwordChanges?.map((h: any) => (
            <Card key={h.id}>
              <Details data={h} />
            </Card>
          ))}
        </>
      )}
    </ResourcePage>
  );
}
