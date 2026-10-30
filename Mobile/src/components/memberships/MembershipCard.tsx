import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, Dumbbell } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { typeface, lime } from "../../constants/design";
import type { Membership } from "../../types/domain";
import { daysLeft, dateLabel } from "../../utils/format.cjs";

export function MembershipCard({
  membership,
  onPress,
}: {
  membership: Membership;
  onPress: () => void;
}) {
  const remaining = daysLeft(membership.endDate);
  const total = Math.max(
    1,
    Math.ceil(
      (new Date(membership.endDate).getTime() -
        new Date(membership.startDate).getTime()) /
        86400000,
    ) || 1,
  );
  const progress = Math.min(100, Math.max(0, (remaining / total) * 100));
  const active = membership.status === "ACTIVE";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${membership.plan?.gym?.name || "gym"} membership, ${membership.status.toLowerCase()}, ${remaining} days left`}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        marginBottom: 16,
      })}
    >
      <LinearGradient
        colors={["#2C2842", "#191C2B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 25,
          borderWidth: 1,
          borderColor: "#514369",
          overflow: "hidden",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -45,
            top: -65,
            height: 220,
            width: 220,
            borderRadius: 110,
            borderColor: "#C7ACFF12",
            borderWidth: 32,
          }}
        />
        <View style={{ padding: 22 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Dumbbell size={15} color="#CBB4FF" />
              <Text
                style={{
                  color: "#CBB4FF",
                  fontFamily: typeface.bold,
                  fontSize: 10,
                  letterSpacing: 2,
                }}
              >
                FITSWAP PASS
              </Text>
            </View>
            <View
              style={{
                backgroundColor: active ? "#D9FF7018" : "#B7A2EE18",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
              }}
            >
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: active ? lime : "#CBB4FF",
                }}
              />
              <Text
                style={{
                  color: active ? lime : "#CBB4FF",
                  fontSize: 9,
                  fontFamily: typeface.bold,
                }}
              >
                {membership.status.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
          <Text
            style={{
              color: "#fff",
              fontFamily: typeface.display,
              fontSize: 23,
              letterSpacing: -0.7,
              marginTop: 23,
            }}
          >
            {membership.plan?.gym?.name || "Your gym"}
          </Text>
          <Text
            style={{
              color: "#B8B5CA",
              fontFamily: typeface.medium,
              fontSize: 12,
              marginTop: 5,
            }}
          >
            {membership.plan?.name}{" "}
            {membership.plan?.gym?.city ? `· ${membership.plan.gym.city}` : ""}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 22,
            }}
          >
            <View>
              <Text
                style={{
                  color: "#fff",
                  fontFamily: typeface.display,
                  fontSize: 27,
                }}
              >
                {remaining}
                <Text
                  style={{
                    color: "#B8B5CA",
                    fontSize: 11,
                    fontFamily: typeface.medium,
                  }}
                >
                  {" "}
                  days left
                </Text>
              </Text>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#FFFFFF0D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowUpRight size={18} color="#D5C3FF" />
            </View>
          </View>
          <View
            accessibilityLabel={`${Math.round(progress)} percent of membership time remaining`}
            style={{
              height: 3,
              backgroundColor: "#FFFFFF14",
              borderRadius: 2,
              marginTop: 13,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${progress}%`,
                height: 3,
                backgroundColor: active ? lime : "#A78BFA",
              }}
            />
          </View>
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#FFFFFF15",
            borderStyle: "dashed",
            paddingHorizontal: 22,
            paddingVertical: 12,
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <Text
            style={{
              color: "#B8B5CA",
              fontSize: 10,
              fontFamily: typeface.medium,
            }}
          >
            VALID UNTIL {dateLabel(membership.endDate).toUpperCase()}
          </Text>
          <Text
            style={{
              color: "#DFD4FA",
              fontSize: 10,
              fontFamily: typeface.bold,
            }}
          >
            View membership ↗
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
