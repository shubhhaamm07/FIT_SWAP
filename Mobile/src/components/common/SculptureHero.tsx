import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, Sparkles } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import { useAppearance } from "../../contexts/AppearanceContext";
import { typeface, lime } from "../../constants/design";
import { useResponsive } from "../../hooks/useResponsive";

export default function SculptureHero({
  title = "New goals.\nNo limits.",
  description = "Find your next gym. Pass on your membership. Keep moving.",
  action = "Find my fit",
  onPress,
}: {
  title?: string;
  description?: string;
  action?: string;
  onPress?: () => void;
}) {
  const { compact, width } = useResponsive();
  const { reducedMotion } = useAppearance();
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) {
      float.setValue(0);
      return;
    }
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    motion.start();
    return () => motion.stop();
  }, [float, reducedMotion]);
  const small = width < 380;
  return (
    <LinearGradient
      colors={["#6744CA", "#452389", "#261643"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 28,
        overflow: "hidden",
        minHeight: compact ? 286 : 320,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: 130,
          borderWidth: 1,
          borderColor: "#D6C1FF25",
          right: -50,
          top: 15,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 340,
          height: 340,
          borderRadius: 170,
          borderWidth: 1,
          borderColor: "#D6C1FF18",
          right: -90,
          top: -25,
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: compact ? -32 : -5,
          top: compact ? -8 : -38,
          width: compact ? "55%" : "45%",
          height: compact ? 330 : 400,
          transform: [
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              }),
            },
            { rotate: "9deg" },
          ],
        }}
      >
        <Image
          source={require("../../assets/images/membership-sculpture.png")}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
          accessibilityLabel="Sculptural fitness pass surrounded by weights and violet ribbons"
        />
      </Animated.View>
      <View
        style={{
          padding: small ? 22 : 26,
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 18,
          }}
        >
          <Sparkles color={lime} size={12} />
          <Text
            style={{
              fontFamily: typeface.bold,
              color: lime,
              fontSize: 9,
              letterSpacing: 2,
            }}
          >
            FITNESS. ON YOUR TERMS.
          </Text>
        </View>
        <Text
          style={{
            width: "66%",
            fontFamily: typeface.display,
            color: "#fff",
            fontSize: small ? 31 : compact ? 36 : 42,
            lineHeight: small ? 36 : compact ? 41 : 48,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            width: "58%",
            fontFamily: typeface.medium,
            color: "#E1D7F5",
            fontSize: 11,
            lineHeight: 18,
            marginTop: 12,
          }}
        >
          {description}
        </Text>
        {onPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
              backgroundColor: lime,
              opacity: pressed ? 0.8 : 1,
              borderRadius: 14,
              paddingHorizontal: 16,
              minHeight: 44,
              marginTop: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            })}
          >
            <Text
              style={{
                color: "#182010",
                fontFamily: typeface.bold,
                fontSize: 12,
              }}
            >
              {action}
            </Text>
            <ArrowUpRight color="#182010" size={17} />
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}
