import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Search,
  ShieldCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useAppearance } from "../../contexts/AppearanceContext";
import { typeface, surfaceShadow } from "../../constants/design";
import type { Gym } from "../../types/domain";

export { Page } from "../../layouts/PageLayout";
export function Header({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const navigation = useNavigation();
  return (
    <View className="mb-6 mt-2">
      <View className="flex-row items-center justify-between">
        {back && navigation.canGoBack() && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            className="mr-3 min-h-11 min-w-11 items-center justify-center rounded-2xl border border-line bg-panel"
          >
            <ArrowLeft size={20} color="#8B5CF6" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text
            style={{ fontFamily: typeface.display, letterSpacing: -1.2 }}
            className="text-3xl text-white"
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="mt-2 text-sm font-normal leading-6 text-muted">
              {subtitle}
            </Text>
          )}
        </View>
        {action}
      </View>
    </View>
  );
}
export function Brand() {
  return (
    <View className="flex-row items-center gap-2">
      <View
        style={{ transform: [{ rotate: "-8deg" }] }}
        className="h-10 w-10 items-center justify-center rounded-2xl bg-lime"
      >
        <Dumbbell size={23} color="#151720" />
      </View>
      <Text className="text-2xl font-extrabold tracking-tight text-white">
        Fit<Text className="text-violet-400">Swap</Text>
      </Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
  busy,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled || busy ? 0.45 : pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 py-3.5 ${secondary ? "border border-line bg-panel" : "bg-brand"}`}
    >
      {busy ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text
          style={[
            { fontFamily: typeface.bold },
            secondary ? undefined : { color: "#fff" },
          ]}
          className="text-sm text-white"
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={surfaceShadow}
      className="mb-4 overflow-hidden rounded-3xl border border-line bg-panel p-5"
    >
      {children}
    </View>
  );
}
export function Badge({ title, green }: { title: string; green?: boolean }) {
  return (
    <View
      className={`self-start flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${green ? "bg-emerald-400/10" : "bg-violet-400/10"}`}
    >
      <View
        className={`h-1 w-1 rounded-full ${green ? "bg-emerald-300" : "bg-violet-300"}`}
      />
      <Text
        className={`text-[10px] font-bold uppercase tracking-wider ${green ? "text-emerald-300" : "text-violet-300"}`}
      >
        {title.replace(/_/g, " ")}
      </Text>
    </View>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View className="mb-3 mt-5 flex-row items-center justify-between gap-3">
      <Text
        style={{ letterSpacing: -0.6 }}
        className="flex-1 text-xl font-extrabold text-white"
      >
        {title}
      </Text>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          className="min-h-11 flex-row items-center gap-1"
        >
          <Text className="text-xs font-bold text-violet-300">{action}</Text>
          <ArrowRight size={16} color="#C4B5FD" />
        </Pressable>
      )}
    </View>
  );
}
export function Field({
  label,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  const { appearance } = useAppearance();
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-semibold text-zinc-300">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#71717A"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          { fontFamily: typeface.medium },
          style,
          focused
            ? {
                borderColor: "#8B5CF6",
                borderWidth: appearance.enhancedFocus ? 3 : 1,
              }
            : undefined,
        ]}
        selectionColor="#A78BFA"
        className="min-h-14 rounded-2xl border border-line bg-panel px-4 py-3 text-base text-white"
        {...props}
      />
    </View>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-line bg-panel px-4">
      <Search size={19} color="#BDA5F8" />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#71717A"
        style={{ fontFamily: typeface.medium }}
        className="min-h-14 flex-1 text-sm text-white"
      />
    </View>
  );
}
export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <View className="items-center rounded-3xl border border-dashed border-line px-5 py-12">
      <Dumbbell size={30} color="#8B5CF6" />
      <Text className="mt-4 text-center text-lg font-semibold text-white">
        {title}
      </Text>
      {body && (
        <Text className="mt-2 text-center text-sm leading-6 text-muted">
          {body}
        </Text>
      )}
    </View>
  );
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return loading ? (
    <View className="py-12">
      <ActivityIndicator color="#A78BFA" size="large" />
      <Text className="mt-4 text-center text-sm text-muted">
        Loading your FitSwap…
      </Text>
    </View>
  ) : error ? (
    <View className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/5 p-5">
      <Text
        accessibilityRole="alert"
        className="mb-4 text-sm leading-6 text-red-200"
      >
        {error}
      </Text>
      <Button secondary title="Try again" onPress={retry} />
    </View>
  ) : null;
}
export function GymImage({
  gym,
  height = 160,
}: {
  gym?: Gym;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const uri =
    gym?.images?.find((i) => i.isPrimary)?.imageUrl ||
    gym?.images?.[0]?.imageUrl;
  return (
    <Image
      onError={() => setFailed(true)}
      source={
        uri && !failed
          ? { uri }
          : require("../../assets/images/gym-interior.png")
      }
      style={{ height, width: "100%" }}
      resizeMode="cover"
      accessibilityLabel={gym?.name || "Fitness studio"}
    />
  );
}
export function Verified() {
  return (
    <View className="flex-row items-center gap-1.5">
      <ShieldCheck size={13} color="#6EE7B7" />
      <Text className="text-xs font-semibold text-emerald-300">
        Verified partner
      </Text>
    </View>
  );
}
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-5 border-b border-line py-3">
      <Text className="flex-1 text-sm text-muted">{label}</Text>
      <Text className="flex-1 text-right text-sm font-medium text-white">
        {value}
      </Text>
    </View>
  );
}
