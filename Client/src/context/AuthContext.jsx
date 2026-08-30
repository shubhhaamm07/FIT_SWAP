import { useEffect, useState } from "react";

import { AuthContext } from "./auth-context";
import { getCurrentUser } from "../api/auth.api";

function getStoredUser() {
  const storedUser = localStorage.getItem("user");
  const storedToken = localStorage.getItem("token");

  if (!storedUser || !storedToken) {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);

    if (parsedUser && typeof parsedUser === "object") return parsedUser;
  } catch {
    // A stale or malformed browser session must never stop the app from rendering.
  }

  localStorage.removeItem("user");
  localStorage.removeItem("token");
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;

    let active = true;
    getCurrentUser({ skipAuthLogout: true })
      .then((response) => {
        if (!active) return;
        const currentUser = response.user;
        localStorage.setItem("user", JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((currentUser) => {
      const nextUser = { ...currentUser, ...userData };
      localStorage.setItem("user", JSON.stringify(nextUser));
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
