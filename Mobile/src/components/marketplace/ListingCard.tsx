import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, MapPin, Clock3 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { typeface, lime } from "../../constants/design";
import type { Listing } from "../../types/domain";
import { daysLeft, discount, money } from "../../utils/format.cjs";
import { GymImage, Verified } from "../ui/index";
export function ListingCard({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const plan = listing.membership?.plan;
  const gym = plan?.gym;
  const saving = discount(listing.askingPrice, plan?.price);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${gym?.name} membership for ${money(listing.askingPrice)}`}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="mb-4 overflow-hidden rounded-3xl border border-line bg-panel"
    >
      <View>
        <GymImage gym={gym} height={190} />
        <LinearGradient
          colors={["#00000008", "#000000B0"]}
          style={{ position: "absolute", inset: 0 }}
        />
        <View
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            flexDirection: "row",
            gap: 5,
            alignItems: "center",
            backgroundColor: "#11131CCB",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 7,
          }}
        >
          <Clock3 size={12} color="#E9E3FA" />
          <Text
            style={{ color: "#fff", fontFamily: typeface.bold, fontSize: 10 }}
          >
            {daysLeft(listing.membership.endDate)} days left
          </Text>
        </View>
        {saving > 0 && (
          <View
            style={{
              position: "absolute",
              right: 16,
              top: 16,
              backgroundColor: lime,
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: "#1B2412",
                fontFamily: typeface.bold,
                fontSize: 10,
              }}
            >
              {saving}% BELOW PLAN
            </Text>
          </View>
        )}
        <View
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 17,
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
          }}
        >
          <MapPin size={12} color="#E8E4F0" />
          <Text
            style={{
              color: "#E8E4F0",
              fontSize: 11,
              fontFamily: typeface.medium,
            }}
          >
            {[gym?.city, gym?.state].filter(Boolean).join(", ") ||
              "Partner gym"}
          </Text>
        </View>
      </View>
      <View className="p-5">
        {gym?.status === "APPROVED" && <Verified />}
        <Text className="mt-2 text-xl font-extrabold tracking-tight text-white">
          {gym?.name || "Partner gym"}
        </Text>
        <Text className="mt-1 text-xs font-medium text-muted">
          {plan?.name}
        </Text>
        <View className="mt-4 flex-row items-center justify-between border-t border-line pt-4">
          <View>
            <Text className="text-[10px] font-medium text-muted">
              MAKE IT YOURS
            </Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-2">
              <Text className="text-2xl font-extrabold tracking-tight text-white">
                {money(listing.askingPrice)}
              </Text>
              {saving > 0 && (
                <Text className="text-xs font-medium text-muted line-through">
                  {money(plan?.price)}
                </Text>
              )}
            </View>
          </View>
          <View
            style={{ backgroundColor: lime }}
            className="h-11 w-11 items-center justify-center rounded-2xl"
          >
            <ArrowUpRight size={22} color="#182010" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
