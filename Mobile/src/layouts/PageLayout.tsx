import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useAppearance } from "../contexts/AppearanceContext";
import { useResponsive } from "../hooks/useResponsive";
import { typeface } from "../constants/design";
export function Page({
  children,
  refreshing = false,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { demo } = useAuth();
  const { dark } = useAppearance();
  const { gutter, tablet } = useResponsive();
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-canvas">
      <LinearGradient
        pointerEvents="none"
        colors={dark ? ["#21172C88", "#0A0B1000"] : ["#EDE7FF", "#F5F6FB00"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 320 }}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: gutter,
          paddingTop: 20,
          paddingBottom: tablet ? 48 : 120,
          maxWidth: 1240,
          width: "100%",
          alignSelf: "center",
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#BFA9FF"
            />
          ) : undefined
        }
      >
        {demo && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 22,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: dark ? "#221C32" : "#EDE7FF",
            }}
          >
            <View
              style={{ flexDirection: "row", gap: 7, alignItems: "center" }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#A78BFA",
                }}
              />
              <Text
                className="text-violet-300"
                style={{
                  fontFamily: typeface.bold,
                  fontSize: 9,
                  letterSpacing: 1.5,
                }}
              >
                EXPLORING FITSWAP
              </Text>
            </View>
            <Text
              className="text-muted"
              style={{ fontFamily: typeface.medium, fontSize: 9 }}
            >
              Sample data · Read only
            </Text>
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
