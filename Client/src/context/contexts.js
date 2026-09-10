import { createContext } from "react";

// One canonical context module prevents casing-only duplicates that work on
// macOS but can fail after a Linux deployment.
export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const AppearanceContext = createContext(null);
