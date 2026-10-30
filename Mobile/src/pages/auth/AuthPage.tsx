import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { request } from "../../api/client";
import GoogleSignIn from "../../components/common/GoogleSignIn";
import SculptureHero from "../../components/common/SculptureHero";
import { Brand, Button, Field, Page } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
type Mode =
  "login" | "register" | "reset" | "verify" | "finishReset" | "verifyToken";
export default function AuthPage() {
  const { signIn, preview, startupError, retry } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("USER");
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    function handle(url: string) {
      const parsed = Linking.parse(url);
      const path = `${parsed.hostname || ""}/${parsed.path || ""}`;
      if (
        parsed.queryParams?.token &&
        /reset-password|verify-email/.test(path)
      ) {
        setToken(String(parsed.queryParams.token));
        setMode(
          path.includes("reset-password") ? "finishReset" : "verifyToken",
        );
      }
    }
    void Linking.getInitialURL().then((url) => url && handle(url));
    const sub = Linking.addEventListener("url", (e) => handle(e.url));
    return () => sub.remove();
  }, []);
  function changeMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
  }
  async function submit() {
    if (busy) return;
    if (
      !["finishReset", "verifyToken"].includes(mode) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Enter a valid email address.");
      return;
    }
    if (["login", "register", "finishReset"].includes(mode) && !password) {
      setError("Enter your password.");
      return;
    }
    if (
      mode === "register" &&
      (!firstName.trim() || !lastName.trim() || password.length < 12)
    ) {
      setError(
        "Enter your first and last name and a password of at least 12 characters.",
      );
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") await signIn(email, password);
      else if (mode === "register") {
        await request("/auth/register", {
          method: "POST",
          body: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim() || null,
            email: email.trim().toLowerCase(),
            password,
            role,
          },
        });
        changeMode("login");
        setPassword("");
        setMessage(
          "Account created. Verify your email using the link in your inbox, then sign in.",
        );
      } else if (mode === "finishReset" || mode === "verifyToken") {
        if (!token.trim())
          throw new Error("Enter the token from your secure email link.");
        const result = await request<any>(
          mode === "finishReset"
            ? "/auth/reset-password"
            : "/auth/verify-email",
          {
            method: "POST",
            body:
              mode === "finishReset"
                ? { token: token.trim(), newPassword: password }
                : { token: token.trim() },
          },
        );
        changeMode("login");
        setToken("");
        setPassword("");
        setMessage(result.message);
      } else {
        const result = await request<any>(
          mode === "reset"
            ? "/auth/forgot-password"
            : "/auth/resend-verification",
          { method: "POST", body: { email: email.trim().toLowerCase() } },
        );
        setMessage(result.message || "Check your inbox.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page>
        <View className="mb-7">
          <Brand />
        </View>
        <ResponsiveGrid maxColumns={2}>
          <View className="mb-7">
            <SculptureHero
              title={"More life.\nMore moves."}
              description="A more flexible fitness journey. Buy, sell, and manage gym memberships in one place."
            />
          </View>
          <View className="rounded-3xl border border-line bg-panel p-6">
            <Text className="text-3xl font-bold text-white">
              {
                {
                  login: "Welcome back",
                  register: "Join the movement",
                  reset: "Reset your password",
                  verify: "Verify your email",
                  finishReset: "Set a new password",
                  verifyToken: "Confirm your email",
                }[mode]
              }
            </Text>
            <Text className="mb-6 mt-3 text-sm leading-6 text-muted">
              Your fitness journey, on your terms.
            </Text>
            {startupError && (
              <Pressable
                onPress={retry}
                accessibilityRole="button"
                className="mb-4 rounded-xl border border-line p-3"
              >
                <Text className="text-xs leading-5 text-muted">
                  {startupError} Tap to reconnect.
                </Text>
              </Pressable>
            )}
            {mode === "register" && (
              <>
                <View className="mb-5 flex-row flex-wrap gap-2">
                  {[
                    ["USER", "Member"],
                    ["GYM_OWNER", "Gym owner"],
                  ].map(([value, title]) => (
                    <Button
                      key={value}
                      secondary={role !== value}
                      title={title}
                      onPress={() => setRole(value)}
                    />
                  ))}
                </View>
                <Field
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                />
                <Field
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                />
                <Field
                  label="Phone (optional)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}
            {!["finishReset", "verifyToken"].includes(mode) && (
              <Field
                label="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            )}
            {["finishReset", "verifyToken"].includes(mode) && (
              <Field
                label="Secure email token"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                multiline
              />
            )}
            {["login", "register", "finishReset"].includes(mode) && (
              <>
                <Field
                  label={mode === "finishReset" ? "New password" : "Password"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowPassword((v) => !v)}
                  className="mb-3 min-h-11 justify-center"
                >
                  <Text className="text-xs text-violet-400">
                    {showPassword ? "Hide" : "Show"} password
                  </Text>
                </Pressable>
                {mode !== "login" && (
                  <Text className="mb-4 text-xs leading-5 text-muted">
                    Use 12–128 characters and at least three of: lowercase,
                    uppercase, numbers, symbols. Avoid your name and email.
                  </Text>
                )}
              </>
            )}
            {!!error && (
              <Text
                accessibilityRole="alert"
                className="mb-4 text-sm leading-6 text-red-400"
              >
                {error}
              </Text>
            )}
            {!!message && (
              <Text
                accessibilityRole="alert"
                className="mb-4 text-sm leading-6 text-emerald-400"
              >
                {message}
              </Text>
            )}
            <Button
              title={
                mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create account"
                    : mode === "finishReset"
                      ? "Update password"
                      : mode === "verifyToken"
                        ? "Verify email"
                        : "Send email link"
              }
              busy={busy}
              onPress={submit}
            />
            {mode === "login" ? (
              <>
                <View className="mt-3">
                  <GoogleSignIn />
                </View>
                <View className="my-2 flex-row flex-wrap justify-between">
                  <Pressable
                    disabled={busy}
                    accessibilityRole="button"
                    onPress={() => changeMode("reset")}
                    className="min-h-11 justify-center"
                  >
                    <Text className="text-xs text-muted">Forgot password?</Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    accessibilityRole="button"
                    onPress={() => changeMode("verify")}
                    className="min-h-11 justify-center"
                  >
                    <Text className="text-xs text-muted">
                      Resend verification
                    </Text>
                  </Pressable>
                </View>
                <Button
                  title="Create an account"
                  secondary
                  onPress={() => changeMode("register")}
                />
                <Text className="mb-3 mt-7 text-xs font-bold uppercase tracking-widest text-muted">
                  Explore read-only previews
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    ["USER", "Member"],
                    ["GYM_OWNER", "Gym owner"],
                    ["ADMIN", "Admin"],
                  ].map(([value, title]) => (
                    <Button
                      key={value}
                      title={title}
                      secondary
                      disabled={busy}
                      onPress={() => preview(value)}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View className="mt-3">
                <Button
                  title="Back to sign in"
                  secondary
                  onPress={() => changeMode("login")}
                />
                {mode === "reset" && (
                  <View className="mt-3">
                    <Button
                      title="I have a reset token"
                      secondary
                      onPress={() => changeMode("finishReset")}
                    />
                  </View>
                )}
                {mode === "verify" && (
                  <View className="mt-3">
                    <Button
                      title="I have a verification token"
                      secondary
                      onPress={() => changeMode("verifyToken")}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </ResponsiveGrid>
      </Page>
    </KeyboardAvoidingView>
  );
}
