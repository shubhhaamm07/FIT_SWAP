import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, MapPin, ShieldCheck } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { Gym } from "../../types/domain";
import { typeface } from "../../constants/design";
import { money } from "../../utils/format.cjs";
import { GymImage } from "../ui/index";
export function GymCard({ gym, onPress }: { gym: Gym; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Explore ${gym.name}`}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="mb-4 overflow-hidden rounded-3xl border border-line bg-panel"
    >
      <View>
        <GymImage gym={gym} height={220} />
        <LinearGradient
          colors={["#00000000", "#10111BDD"]}
          style={{ position: "absolute", inset: 0 }}
        />
        {gym.status === "APPROVED" && (
          <View
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              backgroundColor: "#11131CD9",
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            <ShieldCheck size={12} color="#D9FF70" />
            <Text
              style={{
                color: "#D9FF70",
                fontFamily: typeface.bold,
                fontSize: 9,
              }}
            >
              VERIFIED PARTNER
            </Text>
          </View>
        )}
        <View style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <Text
            style={{
              color: "#FFF",
              fontSize: 25,
              fontFamily: typeface.display,
              letterSpacing: -0.8,
            }}
          >
            {gym.name}
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 5,
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <MapPin size={12} color="#D6D2E1" />
            <Text
              style={{
                color: "#D6D2E1",
                fontSize: 11,
                fontFamily: typeface.medium,
              }}
            >
              {[gym.city, gym.state].filter(Boolean).join(", ")}
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-row items-center justify-between p-5">
        <View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
            YOUR NEXT TRAINING SPACE
          </Text>
          <Text className="mt-1 text-sm font-bold text-white">
            {gym.plans?.length
              ? `From ${money(Math.min(...gym.plans.map((p) => Number(p.price))))}`
              : "Explore memberships"}
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-violet-400/10">
          <ArrowUpRight size={20} color="#BBA0F7" />
        </View>
      </View>
    </Pressable>
  );
}
