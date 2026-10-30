import React from "react";
import { View } from "react-native";
import { useResponsive } from "../../hooks/useResponsive";
export function ResponsiveGrid({
  children,
  maxColumns = 3,
}: {
  children: React.ReactNode;
  maxColumns?: number;
}) {
  const { columns } = useResponsive();
  const count = Math.min(columns, maxColumns);
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -7 }}
    >
      {React.Children.toArray(children).map((child, i) => (
        <View
          key={i}
          style={{ width: `${100 / count}%`, paddingHorizontal: 7 }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
