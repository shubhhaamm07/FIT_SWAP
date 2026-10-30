import React, { createContext, useContext, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useThemeVariables } from "./AppearanceContext";

type Prompt = {
  title: string;
  message: string;
  action: string;
  resolve: (ok: boolean) => void;
};
const Context = createContext<{
  notify: (message: string) => void;
  confirm: (
    title: string,
    message: string,
    action?: string,
  ) => Promise<boolean>;
}>(null!);
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const themeVariables = useThemeVariables();
  const [message, setMessage] = useState("");
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 5500);
  };
  const confirm = (title: string, message: string, action = "Confirm") =>
    new Promise<boolean>((resolve) =>
      setPrompt({ title, message, action, resolve }),
    );
  const close = (ok: boolean) => {
    prompt?.resolve(ok);
    setPrompt(null);
  };
  return (
    <Context.Provider value={{ notify, confirm }}>
      {children}
      {!!message && (
        <Pressable
          accessibilityRole="alert"
          onPress={() => setMessage("")}
          className="absolute left-5 right-5 top-16 z-50 rounded-2xl border border-violet-400 bg-panel p-4"
        >
          <Text className="text-sm leading-5 text-white">{message}</Text>
        </Pressable>
      )}
      <Modal
        transparent
        animationType="fade"
        visible={!!prompt}
        onRequestClose={() => close(false)}
      >
        <View
          style={themeVariables}
          className="flex-1 justify-center bg-black/80 px-6"
        >
          <View className="w-full max-w-lg self-center rounded-3xl border border-line bg-panel p-6">
            <Text className="text-xl font-bold text-white">
              {prompt?.title}
            </Text>
            <Text className="mb-6 mt-3 text-base leading-6 text-muted">
              {prompt?.message}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => close(true)}
              className="items-center rounded-2xl bg-brand p-4"
            >
              <Text style={{ color: "#fff" }} className="font-bold">
                {prompt?.action}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => close(false)}
              className="mt-2 items-center p-4"
            >
              <Text className="font-semibold text-muted">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Context.Provider>
  );
}
export const useFeedback = () => useContext(Context);
