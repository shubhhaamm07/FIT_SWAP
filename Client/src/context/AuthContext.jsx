import { useEffect, useState } from "react";

import { AuthContext } from "./auth-context";
import { getCurrentUser, logoutUser } from "../api/auth.api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentUser({ skipAuthLogout: true })
      .then((response) => {
        if (!active) return;
        setUser(response.user);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
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
