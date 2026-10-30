import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  API_URL,
  getPreviewRole,
  getSessionToken,
  request,
} from "../api/client";
export type SelectedFile = {
  uri: string;
  name: string;
  mimeType: string;
  file?: globalThis.File;
  size?: number;
};
export async function pickFile(image = false): Promise<SelectedFile | null> {
  if (image) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName || "photo.jpg",
      mimeType: asset.mimeType || "image/jpeg",
      file: asset.file,
      size: asset.fileSize,
    };
  }
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ["application/pdf", "image/*"],
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType || "application/octet-stream",
    file: asset.file,
    size: asset.size,
  };
}
export function appendFile(form: FormData, name: string, file: SelectedFile) {
  if (Platform.OS === "web" && file.file) form.append(name, file.file);
  else
    form.append(name, {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
}
export async function upload(
  path: string,
  fields: Record<string, unknown>,
  files: { field: string; file: SelectedFile }[],
  method = "POST",
) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) =>
    form.append(key, value == null ? "" : String(value)),
  );
  files.forEach((f) => appendFile(form, f.field, f.file));
  return request<any>(path, { method, body: form, timeout: 120000 });
}
export async function download(path: string, name: string) {
  if (getPreviewRole())
    throw new Error(
      "Preview attachments are not available. Sign in to view real files.",
    );
  if (Platform.OS === "web") {
    const blob = await request<Blob>(path, { responseType: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, name.replace(/[^A-Za-z0-9._-]/g, "_"));
  await File.downloadFileAsync(`${API_URL}${path}`, file, {
    idempotent: true,
    headers: getSessionToken()
      ? { Authorization: `Bearer ${getSessionToken()}` }
      : {},
  });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri);
}
