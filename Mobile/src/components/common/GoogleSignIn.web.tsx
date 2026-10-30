import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAction } from "../../hooks/useApi";
import { Button } from "../ui";
WebBrowser.maybeCompleteAuthSession();
function ConfiguredGoogle() {
  const { google } = useAuth();
  const { run, busy } = useAction();
  const [authRequest, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
  });
  useEffect(() => {
    if (response?.type === "success" && response.params.id_token)
      void run(() => google(response.params.id_token));
  }, [response]);
  return (
    <Button
      secondary
      title="Continue with Google"
      disabled={!authRequest}
      busy={busy}
      onPress={() =>
        run(async () => {
          await promptAsync();
        })
      }
    />
  );
}
export default function GoogleSignIn() {
  if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) return null;
  return <ConfiguredGoogle />;
}
