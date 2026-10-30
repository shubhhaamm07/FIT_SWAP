import "./global.css";
import React from "react";
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/contexts/AuthContext";
import {
  AppearanceProvider,
  useAppearance,
} from "./src/contexts/AppearanceContext";
import { FeedbackProvider } from "./src/contexts/FeedbackContext";
import { FormProvider } from "./src/contexts/FormContext";
import { useLiveNotifications } from "./src/hooks/useLiveNotifications";
import AppNavigator from "./src/routes/AppNavigator";
function Application() {
  useLiveNotifications();
  const { dark } = useAppearance();
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <AppNavigator />
    </>
  );
}
export default function App() {
  const [fontsReady, fontsError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (!fontsReady && !fontsError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A0B10",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#D9FF70" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <AuthProvider>
          <FeedbackProvider>
            <FormProvider>
              <Application />
            </FormProvider>
          </FeedbackProvider>
        </AuthProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
