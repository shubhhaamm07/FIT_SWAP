import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppearance } from "../../contexts/AppearanceContext";
import { typeface, lime } from "../../constants/design";
import { Brand } from "../ui";
import { useResponsive } from "../../hooks/useResponsive";
export default function FloatingTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const { tablet } = useResponsive();
  const { dark } = useAppearance();
  const insets = useSafeAreaInsets();

  if (tablet)
    return (
      <View
        style={{
          width: 180,
          padding: 16,
          paddingTop: insets.top + 28,
          backgroundColor: dark ? "#111219" : "#FFFFFF",
          borderRightWidth: 1,
          borderRightColor: dark ? "#2B2D3B" : "#D9D6E8",
        }}
      >
        <Brand />
        <View accessibilityRole="tablist" style={{ marginTop: 40, gap: 8 }}>
          {state.routes.map((route, index) => {
            const active = state.index === index;
            const options = descriptors[route.key].options;
            const color = active ? "#182010" : dark ? "#ACABBF" : "#676477";
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                aria-selected={active}
                accessibilityLabel={options.title || route.name}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!active && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
                style={{
                  minHeight: 48,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 15,
                  backgroundColor: active ? lime : "transparent",
                }}
              >
                {options.tabBarIcon?.({ focused: active, color, size: 22 })}
                <Text
                  style={{
                    fontFamily: typeface.bold,
                    color,
                    fontSize: 11,
                    flexShrink: 1,
                  }}
                >
                  {options.title || route.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  return (
    <View
      accessibilityRole="tablist"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: Math.max(12, insets.bottom),
        paddingHorizontal: 6,
        paddingTop: 9,
        paddingBottom: 8,
        flexDirection: "row",
        borderRadius: 27,
        backgroundColor: dark ? "#1A1C28" : "#FFFFFF",
        borderWidth: 1,
        borderColor: dark ? "#363747" : "#D9D6E8",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.24,
        shadowRadius: 22,
        elevation: 10,
      }}
    >
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const options = descriptors[route.key].options;
        const label =
          options.title === "Memberships"
            ? "Wallet"
            : options.title === "Marketplace"
              ? "Explore"
              : options.title === "Your space"
                ? "Profile"
                : options.title || route.name;
        const color = active ? "#171E10" : dark ? "#A7A8BB" : "#676477";
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!active && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              minHeight: 53,
            }}
          >
            <View
              style={{
                width: 44,
                height: 31,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? lime : "transparent",
              }}
            >
              {options.tabBarIcon?.({ focused: active, color, size: 23 })}
            </View>
            <Text
              numberOfLines={1}
              style={{
                color: active
                  ? dark
                    ? "#F6F4FF"
                    : "#322C49"
                  : dark
                    ? "#9899AE"
                    : "#676477",
                fontSize: 9,
                fontFamily: active ? typeface.bold : typeface.medium,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
