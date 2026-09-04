import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { AppearanceProvider } from "./context/AppearanceContext";
import { ToastProvider } from "./context/ToastContext";
import { initializeAppearance } from "./utils/appearance";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Apply the saved palette before React renders to avoid a light/dark flash.
initializeAppearance();

const application = (
  <AppearanceProvider>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </AppearanceProvider>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {application}
      </GoogleOAuthProvider>
    ) : application}
  </StrictMode>,
);
