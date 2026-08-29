import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const application = (
  <>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </>
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
