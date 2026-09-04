import { useEffect, useRef, useState } from "react";

import { AuthContext } from "./auth-context";
import { getCurrentUser, logoutUser } from "../api/auth.api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // A sign-in can finish before the initial "who am I?" request. Track the
  // latest auth action so that older responses cannot erase a new session.
  const authVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const requestVersion = ++authVersion.current;
    getCurrentUser({ skipAuthLogout: true })
      .then((response) => {
        if (!active || requestVersion !== authVersion.current) return;
        setUser(response.user);
      })
      .catch(() => {
        if (!active || requestVersion !== authVersion.current) return;
        setUser(null);
      })
      .finally(() => {
        if (active && requestVersion === authVersion.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = (userData) => {
    authVersion.current += 1;
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    authVersion.current += 1;
    void logoutUser().catch(() => undefined);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((currentUser) => {
      const nextUser = { ...currentUser, ...userData };
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
