import { Text, View } from "react-native";
export default function BarChart({
  data,
  labelKey = "label",
  valueKey = "value",
}: {
  data: Record<string, any>[];
  labelKey?: string;
  valueKey?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <View accessibilityLabel="Chart">
      {data.slice(0, 31).map((d, i) => (
        <View key={i} className="mb-3">
          <View className="mb-1 flex-row justify-between">
            <Text className="text-xs text-muted">
              {String(d[labelKey] ?? i + 1)}
            </Text>
            <Text className="text-xs text-white">
              {String(d[valueKey] ?? 0)}
            </Text>
          </View>
          <View className="h-2 rounded-full bg-violet-400/10">
            <View
              style={{
                width: `${Math.max(2, (Number(d[valueKey]) / max) * 100)}%`,
                height: 8,
                borderRadius: 8,
                backgroundColor: "#8B5CF6",
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
