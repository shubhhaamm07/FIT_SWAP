import {
  Activity,
  Building2,
  Users,
  Wallet,
  Repeat2,
} from "lucide-react-native";
import { Text, View } from "react-native";
import { typeface } from "../../constants/design";
import { money } from "../../utils/format.cjs";
import { label } from "./ResourcePage";

export default function OverviewGrid({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data).filter(
    ([key, value]) =>
      value != null &&
      typeof value !== "object" &&
      !/^(id|userId|ownerId)$/i.test(key),
  );
  const colors = ["#BEA5FF", "#D9FF70", "#94C8FF", "#FFBC96"];
  return (
    <View className="mb-3 flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
      {entries.map(([key, value], i) => {
        const color = colors[i % colors.length];
        const Icon = /revenue|price|amount|sales/i.test(key)
          ? Wallet
          : /member|user/i.test(key)
            ? Users
            : /gym/i.test(key)
              ? Building2
              : /transfer/i.test(key)
                ? Repeat2
                : Activity;
        return (
          <View key={key} style={{ width: "50%", padding: 6 }}>
            <View className="rounded-3xl border border-line bg-panel p-5">
              <View className="mb-5 flex-row justify-between">
                <View
                  style={{
                    backgroundColor: `${color}15`,
                    padding: 9,
                    borderRadius: 13,
                  }}
                >
                  <Icon size={19} color={color} />
                </View>
              </View>
              <Text
                style={{ fontFamily: typeface.display, letterSpacing: -1 }}
                className="text-3xl text-white"
              >
                {typeof value === "boolean"
                  ? value
                    ? "Yes"
                    : "No"
                  : /(price|amount|revenue|fee|saleValue)$/i.test(key)
                    ? money(value)
                    : typeof value === "number"
                      ? value.toLocaleString("en-IN")
                      : String(value)}
              </Text>
              <Text className="mt-2 text-xs font-medium leading-5 text-muted">
                {label(key)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
