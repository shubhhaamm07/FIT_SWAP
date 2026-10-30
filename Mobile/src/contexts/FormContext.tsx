import * as Location from "expo-location";
import { Check, X } from "lucide-react-native";
import React, { createContext, useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field, SearchField } from "../components/ui";
import { pickFile } from "../utils/files";
import { useThemeVariables } from "./AppearanceContext";
export type Choice = { value: string; label: string };
export type FormField = {
  key: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "select"
    | "switch"
    | "multiline"
    | "password"
    | "file"
    | "image"
    | "multi"
    | "date"
    | "location";
  required?: boolean;
  options?: Choice[];
  initial?: unknown;
  min?: number;
  max?: number;
  hint?: string;
};
type FormConfig = {
  title: string;
  description?: string;
  fields: FormField[];
  initial?: Record<string, any>;
  submitLabel?: string;
  onSubmit: (values: Record<string, any>) => Promise<unknown>;
};
const Context = createContext<{ openForm: (config: FormConfig) => void }>(
  null!,
);
export function FormProvider({ children }: { children: React.ReactNode }) {
  const themeVariables = useThemeVariables();
  const [optionSearch, setOptionSearch] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormConfig | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const openForm = (config: FormConfig) => {
    setOptionSearch({});
    setValues(
      Object.fromEntries(
        config.fields.map((f) => [
          f.key,
          config.initial?.[f.key] ??
            f.initial ??
            (f.type === "switch" ? false : f.type === "multi" ? [] : ""),
        ]),
      ),
    );
    setError("");
    setForm(config);
  };
  const update = (key: string, value: any) =>
    setValues((s) => ({ ...s, [key]: value }));
  async function submit() {
    if (!form || busy) return;
    setError("");
    const payload = { ...values };
    for (const f of form.fields) {
      const v = values[f.key];
      if (f.type === "location") {
        delete payload[f.key];
        continue;
      }
      if (
        f.required &&
        (v === "" ||
          v == null ||
          (Array.isArray(v) && !v.length) ||
          (f.type === "switch" && !v))
      ) {
        setError(`${f.label} is required.`);
        return;
      }
      if (f.type === "number") {
        if (v === "" || v == null) {
          payload[f.key] = f.required ? 0 : null;
          continue;
        }
        const n = Number(v);
        if (
          !Number.isFinite(n) ||
          (f.min !== undefined && n < f.min) ||
          (f.max !== undefined && n > f.max)
        ) {
          setError(
            `Enter a valid ${f.label.toLowerCase()}${f.min !== undefined ? ` (minimum ${f.min})` : ""}.`,
          );
          return;
        }
        payload[f.key] = n;
      }
      if (f.type === "date" && v) {
        const date = new Date(v);
        if (Number.isNaN(date.getTime())) {
          setError(
            `Enter ${f.label.toLowerCase()} as YYYY-MM-DD or YYYY-MM-DDTHH:mm.`,
          );
          return;
        }
        payload[f.key] = date.toISOString();
      }
    }
    setBusy(true);
    try {
      await form.onSubmit(payload);
      setForm(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ openForm }}>
      {children}
      <Modal
        visible={!!form}
        animationType="slide"
        onRequestClose={() => {
          if (!busy) setForm(null);
        }}
        transparent
      >
        <SafeAreaView
          style={themeVariables}
          className="flex-1 justify-end bg-black/75"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{
              height: "92%",
              width: "100%",
              maxWidth: 680,
              alignSelf: "center",
            }}
          >
            <View
              style={{ flex: 1 }}
              className="rounded-t-[30px] border border-line bg-canvas p-6"
            >
              <View className="mb-5 flex-row items-start gap-3">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-white">
                    {form?.title}
                  </Text>
                  {form?.description && (
                    <Text className="mt-2 text-sm leading-6 text-muted">
                      {form.description}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close form"
                  disabled={busy}
                  onPress={() => setForm(null)}
                  className="h-11 w-11 items-center justify-center rounded-full border border-line"
                >
                  <X size={20} color="#A1A1AA" />
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {form?.fields.map((f) => (
                  <View key={f.key} className="mb-2">
                    {f.type === "switch" ? (
                      <View className="mb-4 flex-row items-center gap-4 rounded-2xl border border-line bg-panel p-4">
                        <Text className="flex-1 text-sm text-white">
                          {f.label}
                        </Text>
                        <Switch
                          accessibilityLabel={f.label}
                          value={!!values[f.key]}
                          onValueChange={(v) => update(f.key, v)}
                          trackColor={{ true: "#8B5CF6" }}
                        />
                      </View>
                    ) : f.type === "location" ? (
                      <View className="mb-4">
                        <Button
                          secondary
                          title="Use current gym location"
                          onPress={async () => {
                            try {
                              const permission =
                                await Location.requestForegroundPermissionsAsync();
                              if (permission.status !== "granted")
                                throw new Error(
                                  "Location permission was not granted. Enter the coordinates manually.",
                                );
                              const point =
                                await Location.getCurrentPositionAsync({
                                  accuracy: Location.Accuracy.High,
                                });
                              setValues((current) => ({
                                ...current,
                                latitude: point.coords.latitude,
                                longitude: point.coords.longitude,
                              }));
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        />
                        <Text className="mt-2 text-xs leading-5 text-muted">
                          Use this only when you are at the gym. Confirm the
                          coordinates below before saving.
                        </Text>
                      </View>
                    ) : f.type === "select" || f.type === "multi" ? (
                      <View className="mb-4">
                        <Text className="mb-2 text-sm font-medium text-white">
                          {f.label}
                        </Text>
                        {(f.options?.length || 0) > 8 && (
                          <SearchField
                            value={optionSearch[f.key] || ""}
                            onChange={(value) =>
                              setOptionSearch((current) => ({
                                ...current,
                                [f.key]: value,
                              }))
                            }
                            placeholder={`Search ${f.label.toLowerCase()}`}
                          />
                        )}
                        <View className="flex-row flex-wrap gap-2">
                          {f.options
                            ?.filter((option) =>
                              option.label
                                .toLowerCase()
                                .includes(
                                  (optionSearch[f.key] || "").toLowerCase(),
                                ),
                            )
                            .map((option) => {
                              const selected =
                                f.type === "multi"
                                  ? (values[f.key] || []).includes(option.value)
                                  : String(values[f.key]) === option.value;
                              return (
                                <Pressable
                                  key={option.value}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected }}
                                  onPress={() =>
                                    update(
                                      f.key,
                                      f.type === "multi"
                                        ? selected
                                          ? values[f.key].filter(
                                              (v: string) => v !== option.value,
                                            )
                                          : [
                                              ...(values[f.key] || []),
                                              option.value,
                                            ]
                                        : option.value,
                                    )
                                  }
                                  className={`min-h-11 flex-row items-center gap-2 rounded-xl border px-3 py-2 ${selected ? "border-violet-400 bg-violet-400/10" : "border-line bg-panel"}`}
                                >
                                  {selected && (
                                    <Check size={13} color="#A78BFA" />
                                  )}
                                  <Text className="text-xs text-white">
                                    {option.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                        </View>
                      </View>
                    ) : f.type === "file" || f.type === "image" ? (
                      <Button
                        secondary
                        title={values[f.key]?.name || f.label}
                        onPress={async () => {
                          try {
                            const selected = await pickFile(f.type === "image");
                            if (selected) update(f.key, selected);
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      />
                    ) : (
                      <Field
                        label={f.label}
                        value={String(values[f.key] ?? "")}
                        onChangeText={(v) => update(f.key, v)}
                        secureTextEntry={f.type === "password"}
                        keyboardType={
                          f.type === "number" ? "decimal-pad" : "default"
                        }
                        multiline={f.type === "multiline"}
                        style={
                          f.type === "multiline"
                            ? { minHeight: 100, textAlignVertical: "top" }
                            : undefined
                        }
                        placeholder={
                          f.type === "date" ? "YYYY-MM-DDTHH:mm" : undefined
                        }
                        autoCapitalize={
                          f.type === "password" ? "none" : "sentences"
                        }
                      />
                    )}
                    {f.hint && (
                      <Text className="mb-4 text-xs leading-5 text-muted">
                        {f.hint}
                      </Text>
                    )}
                  </View>
                ))}
                {!!error && (
                  <Text
                    accessibilityRole="alert"
                    className="mb-4 text-sm leading-6 text-red-400"
                  >
                    {error}
                  </Text>
                )}
                <Button
                  title={form?.submitLabel || "Save changes"}
                  busy={busy}
                  onPress={submit}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </Context.Provider>
  );
}
export const useForm = () => useContext(Context);
export const choices = (values: string[]): Choice[] =>
  values.map((value) => ({
    value,
    label: value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
export const textField = (
  key: string,
  label: string,
  required = true,
): FormField => ({ key, label, required });
export const numberField = (
  key: string,
  label: string,
  initial?: number,
): FormField => ({
  key,
  label,
  type: "number",
  min: 0,
  initial,
  required: true,
});
export const selectField = (
  key: string,
  label: string,
  options: string[],
  initial?: string,
): FormField => ({
  key,
  label,
  type: "select",
  options: choices(options),
  initial: initial || options[0],
  required: true,
});
