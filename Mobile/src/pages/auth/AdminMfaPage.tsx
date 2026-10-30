import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Image, Platform, Text, View } from "react-native";
import { request } from "../../api/client";
import {
  Button,
  Card,
  Field,
  Header,
  LoadState,
  Page,
} from "../../components/ui";
import { useAuth, type SessionResponse } from "../../contexts/AuthContext";
import { useAction } from "../../hooks/useApi";
export default function AdminMfaPage() {
  const { challenge, cancelChallenge, completeSession } = useAuth();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [session, setSession] = useState<SessionResponse | null>(null);
  const { busy, run } = useAction();
  const load = () =>
    request<any>("/auth/admin-mfa/enrollment", {
      method: "POST",
      body: { mfaChallengeToken: challenge },
    })
      .then((r) => {
        setError("");
        setEnrollment(r.data);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, [challenge]);
  return (
    <Page>
      <Header
        title={
          session ? "Save your recovery codes" : "Secure administrator sign-in"
        }
      />
      <LoadState
        loading={!enrollment && !error && !session}
        error={error}
        retry={load}
      />
      {session ? (
        <>
          <Text className="mb-5 text-sm leading-6 text-muted">
            These codes are shown once. Save them in your password manager
            before continuing. Each code can be used once.
          </Text>
          <Card>
            {session.recoveryCodes?.map((c) => (
              <Text
                key={c}
                selectable
                className="py-2 text-center font-mono text-lg text-white"
              >
                {c}
              </Text>
            ))}
          </Card>
          <Button
            title="Copy recovery codes"
            secondary
            onPress={() =>
              run(() =>
                Clipboard.setStringAsync(session.recoveryCodes!.join("\n")),
              )
            }
          />
          <View className="mt-3">
            <Button
              title="I have saved my codes"
              busy={busy}
              onPress={() => run(() => completeSession(session))}
            />
          </View>
        </>
      ) : (
        enrollment && (
          <>
            {enrollment.setupRequired && (
              <Card>
                <Text className="mb-4 text-sm leading-6 text-muted">
                  Scan this QR with your authenticator app, then enter its code.
                </Text>
                {enrollment.qrCodeDataUrl && (
                  <Image
                    source={{ uri: enrollment.qrCodeDataUrl }}
                    style={{
                      width: 192,
                      height: 192,
                      alignSelf: "center",
                      backgroundColor: "#fff",
                    }}
                  />
                )}
                <Text
                  selectable
                  className="my-4 text-center font-mono text-white"
                >
                  {enrollment.manualEntryKey}
                </Text>
                <Button
                  secondary
                  title="Copy setup key"
                  onPress={() =>
                    run(() =>
                      Clipboard.setStringAsync(enrollment.manualEntryKey),
                    )
                  }
                />
              </Card>
            )}
            <Field
              label="Authenticator or recovery code"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
            />
            <Button
              title="Verify and continue"
              busy={busy}
              onPress={() =>
                run(async () => {
                  const result = await request<SessionResponse>(
                    Platform.OS === "web"
                      ? "/auth/admin-mfa/verify"
                      : "/auth/mobile/admin-mfa/verify",
                    {
                      method: "POST",
                      body: { mfaChallengeToken: challenge, code: code.trim() },
                    },
                  );
                  if (result.recoveryCodes?.length) setSession(result);
                  else await completeSession(result);
                })
              }
            />
            <View className="mt-3">
              <Button
                secondary
                title="Back to sign in"
                onPress={cancelChallenge}
              />
            </View>
          </>
        )
      )}
    </Page>
  );
}
