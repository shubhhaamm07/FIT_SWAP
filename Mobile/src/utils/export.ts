import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
export async function exportCsv(name: string, rows: Record<string, unknown>[]) {
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const cell = (value: unknown) => {
    let text =
      typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csv = [
    keys.map(cell).join(","),
    ...rows.map((row) => keys.map((key) => cell(row[key])).join(",")),
  ].join("\r\n");
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  } else {
    const file = new File(Paths.cache, name);
    await file.write(csv);
    if (await Sharing.isAvailableAsync())
      await Sharing.shareAsync(file.uri, { mimeType: "text/csv" });
  }
}
