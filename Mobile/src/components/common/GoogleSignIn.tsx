import { isRunningInExpoGo } from "expo";
import { Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useAction } from "../../hooks/useApi";
import { Button } from "../ui";
export default function GoogleSignIn() {
  const { google } = useAuth();
  const { busy, run } = useAction();
  if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) return null;
  if (isRunningInExpoGo())
    return (
      <View className="rounded-2xl border border-line px-4 py-3">
        <Text className="text-xs font-medium leading-5 text-muted">
          Use email sign-in in Expo Go. Google sign-in is available in the
          installed FitSwap app.
        </Text>
      </View>
    );
  return (
    <Button
      secondary
      title="Continue with Google"
      busy={busy}
      onPress={() =>
        run(async () => {
          const {
            GoogleSignin,
          } = require("@react-native-google-signin/google-signin");
          GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          });
          await GoogleSignin.hasPlayServices({
            showPlayServicesUpdateDialog: true,
          });
          const response = await GoogleSignin.signIn();
          if (response.type === "cancelled") return;
          const credential = response.data?.idToken || response.idToken;
          if (!credential)
            throw new Error(
              "Google did not return a sign-in token. Check the OAuth client configuration.",
            );
          await google(credential);
        })
      }
    />
  );
}
