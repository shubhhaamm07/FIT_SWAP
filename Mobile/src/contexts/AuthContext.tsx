import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  ApiError,
  onSessionExpired,
  request,
  restoreToken,
  saveToken,
  setPreviewRole,
} from "../api/client";
import type { User } from "../types/domain";
import { demoUser } from "../utils/demo";
export type SessionResponse = {
  user: User;
  token?: string;
  mfaRequired?: boolean;
  mfaChallengeToken?: string;
  recoveryCodes?: string[];
};
type Auth = {
  user: User | null;
  loading: boolean;
  startupError: string;
  demo: boolean;
  challenge: string | null;
  retry: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  google: (credential: string) => Promise<void>;
  completeSession: (response: SessionResponse) => Promise<void>;
  cancelChallenge: () => void;
  preview: (role?: string) => void;
  signOut: () => Promise<void>;
  forgetSession: () => Promise<void>;
  updateUser: (user: User) => void;
  call: typeof request;
};
const Context = createContext<Auth>(null!);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState("");
  const [demo, setDemo] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const version = useRef(0);
  async function forgetSession() {
    version.current++;
    await saveToken(null);
    setPreviewRole(null);
    setDemo(false);
    setChallenge(null);
    setUser(null);
    setLoading(false);
    setStartupError("");
  }
  useEffect(
    () =>
      onSessionExpired(() => {
        void forgetSession().catch(() => setUser(null));
      }),
    [],
  );
  useEffect(() => {
    let active = true;
    const v = ++version.current;
    async function boot() {
      setLoading(true);
      setStartupError("");
      try {
        const hasToken = await restoreToken();
        if (Platform.OS !== "web" && !hasToken) return;
        const result = await request<{ user: User }>("/auth/me");
        if (active && v === version.current) setUser(result.user);
      } catch (e) {
        if (!active || v !== version.current) return;
        if (e instanceof ApiError && [401, 403].includes(e.status))
          await saveToken(null);
        else setStartupError((e as Error).message);
      } finally {
        if (active && v === version.current) setLoading(false);
      }
    }
    void boot();
    return () => {
      active = false;
    };
  }, [attempt]);
  async function completeSession(result: SessionResponse) {
    if (
      !result.user ||
      !["USER", "GYM_OWNER", "ADMIN"].includes(result.user.role)
    )
      throw new Error("Unable to confirm your account role.");
    if (Platform.OS !== "web" && !result.token)
      throw new Error("The API needs the latest mobile authentication routes.");
    await saveToken(result.token || null);
    version.current++;
    setPreviewRole(null);
    setDemo(false);
    setChallenge(null);
    setStartupError("");
    setUser(result.user);
  }
  async function authenticate(path: string, body: Record<string, string>) {
    setPreviewRole(null);
    const result = await request<SessionResponse>(path, {
      method: "POST",
      body,
    });
    if (result.mfaRequired && result.mfaChallengeToken) {
      setChallenge(result.mfaChallengeToken);
      return;
    }
    await completeSession(result);
  }
  const signIn = (email: string, password: string) =>
    authenticate(Platform.OS === "web" ? "/auth/login" : "/auth/mobile/login", {
      email: email.trim().toLowerCase(),
      password,
    });
  const google = (credential: string) =>
    authenticate(
      Platform.OS === "web" ? "/auth/google" : "/auth/mobile/google",
      { credential },
    );
  async function signOut() {
    if (!demo) {
      try {
        await request("/auth/logout", { method: "POST" });
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 401)) throw e;
      }
    }
    await forgetSession();
  }
  function preview(role = "USER") {
    version.current++;
    setPreviewRole(role);
    setDemo(true);
    setUser({
      ...demoUser,
      role,
      firstName:
        role === "ADMIN" ? "Admin" : role === "GYM_OWNER" ? "Jordan" : "Alex",
    });
    setLoading(false);
    setStartupError("");
  }
  return (
    <Context.Provider
      value={{
        user,
        loading,
        startupError,
        demo,
        challenge,
        retry: () => setAttempt((a) => a + 1),
        signIn,
        google,
        completeSession,
        cancelChallenge: () => setChallenge(null),
        preview,
        signOut,
        forgetSession,
        updateUser: setUser,
        call: request,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
