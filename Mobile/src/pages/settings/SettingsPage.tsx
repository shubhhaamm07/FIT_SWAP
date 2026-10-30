import { Switch, Text, View } from "react-native";
import { ResourcePage } from "../../components/common/ResourcePage";
import { Button, Card, Section } from "../../components/ui";
import { useAppearance } from "../../contexts/AppearanceContext";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { selectField, textField, useForm } from "../../contexts/FormContext";
import { useAction } from "../../hooks/useApi";
export default function SettingsPage() {
  const { appearance, set, reset } = useAppearance();
  const { call, updateUser, forgetSession } = useAuth();
  const { openForm } = useForm();
  const { confirm, notify } = useFeedback();
  const { run, busy } = useAction();
  return (
    <ResourcePage
      title="Settings"
      subtitle="Make FitSwap feel like you."
      path="/auth/me"
    >
      {(data, reload) => {
        const profile = data.user || data;
        return (
          <>
            <Section title="Appearance & accessibility" />
            <Card>
              <Button
                secondary
                title={`Theme: ${appearance.theme}`}
                onPress={() =>
                  openForm({
                    title: "Choose a theme",
                    fields: [
                      selectField(
                        "theme",
                        "Appearance",
                        ["system", "dark", "light"],
                        appearance.theme,
                      ),
                    ],
                    onSubmit: async (v) => set(v),
                  })
                }
              />
              {(
                [
                  "reduceMotion",
                  "largeText",
                  "highContrast",
                  "enhancedFocus",
                ] as const
              ).map((key) => (
                <View
                  key={key}
                  className="flex-row items-center justify-between gap-4 border-b border-line py-4"
                >
                  <Text className="flex-1 text-sm text-white">
                    {
                      {
                        reduceMotion: "Reduce animation",
                        largeText: "Larger text",
                        highContrast: "Stronger contrast",
                        enhancedFocus: "Enhanced focus indicators",
                      }[key]
                    }
                  </Text>
                  <Switch
                    accessibilityLabel={key}
                    value={appearance[key]}
                    onValueChange={(v) => set({ [key]: v })}
                    trackColor={{ true: "#8B5CF6" }}
                  />
                </View>
              ))}
              <View className="mt-4">
                <Button secondary title="Reset appearance" onPress={reset} />
              </View>
            </Card>
            <Section title="Notifications" />
            <Card>
              {[
                ["emailNotifications", "Email updates"],
                ["marketplaceNotifications", "Marketplace updates"],
                ["membershipExpiryNotifications", "Membership reminders"],
              ].map(([key, title]) => (
                <View
                  key={key}
                  className="flex-row items-center justify-between gap-4 py-3"
                >
                  <Text className="flex-1 text-sm text-white">{title}</Text>
                  <Switch
                    disabled={busy}
                    accessibilityLabel={title}
                    value={!!profile[key]}
                    onValueChange={(value) =>
                      run(async () => {
                        const result = await call<any>("/auth/me/settings", {
                          method: "PATCH",
                          body: { [key]: value },
                        });
                        updateUser(result.user);
                        reload();
                      })
                    }
                  />
                </View>
              ))}
            </Card>
            <Section title="Payment details" />
            <Card>
              <Text className="mb-4 text-sm leading-6 text-muted">
                UPI details are used to receive membership and transfer
                payments.
              </Text>
              <Button
                title="Edit UPI account"
                secondary
                onPress={() =>
                  openForm({
                    title: "Receiving account",
                    fields: [
                      textField("upiId", "UPI ID", false),
                      textField("upiPayeeName", "Account holder name", false),
                    ],
                    initial: profile,
                    onSubmit: async (body) => {
                      await call("/auth/me/settings", {
                        method: "PATCH",
                        body,
                      });
                      reload();
                      notify("Payment details saved.");
                    },
                  })
                }
              />
            </Card>
            <Section title="Account protection" />
            <Card>
              <Button
                secondary
                title="Resend verification email"
                busy={busy}
                onPress={() =>
                  run(
                    () => call("/auth/send-verification", { method: "POST" }),
                    "Check your inbox.",
                  )
                }
              />
              <View className="mt-3">
                <Button
                  secondary
                  title="Change password"
                  onPress={() =>
                    openForm({
                      title: "Change password",
                      description:
                        "Use 12–128 characters and at least three character groups. Changing your password ends your existing sessions.",
                      fields: [
                        {
                          key: "currentPassword",
                          label: "Current password",
                          type: "password",
                          required: true,
                        },
                        {
                          key: "newPassword",
                          label: "New password",
                          type: "password",
                          required: true,
                        },
                      ],
                      onSubmit: async (body) => {
                        await call("/auth/me/password", {
                          method: "PATCH",
                          body,
                        });
                        await forgetSession();
                      },
                    })
                  }
                />
              </View>
            </Card>
            <Section title="Delete account" />
            <Text className="mb-4 text-sm leading-6 text-muted">
              Account deletion is permanent. Active memberships, listings, or
              payments may need to be resolved first.
            </Text>
            <Button
              secondary
              title="Delete my account"
              onPress={() =>
                openForm({
                  title: "Permanently delete account",
                  fields: [
                    {
                      key: "password",
                      label: "Password",
                      type: "password",
                      required: true,
                    },
                    textField("confirmation", "Type DELETE to confirm"),
                  ],
                  onSubmit: async (body) => {
                    if (body.confirmation !== "DELETE")
                      throw new Error("Type DELETE to confirm.");
                    if (
                      !(await confirm(
                        "Permanently delete your account?",
                        "This action cannot be undone.",
                        "Delete account",
                      ))
                    )
                      throw new Error("Account deletion cancelled.");
                    await call("/auth/me", { method: "DELETE", body });
                    await forgetSession();
                  },
                })
              }
            />
          </>
        );
      }}
    </ResourcePage>
  );
}
