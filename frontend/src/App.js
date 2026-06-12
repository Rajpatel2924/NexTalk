import React, { useEffect } from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuth } from "@/store/useAuth";
import { api } from "@/lib/api";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Chat from "@/pages/Chat";

function Protected({ children }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Theme = 'system' | 'light' | 'dark', persisted to localStorage.
// Updates document.documentElement.classList.dark to match the resolved theme.
function useSystemTheme() {
  useEffect(() => {
    const apply = () => {
      const saved = localStorage.getItem("nextalk-theme") || "system";
      const isDark =
        saved === "dark" ||
        (saved === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem("nextalk-theme") || "system") === "system") apply();
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
}

export default function App() {
  const { token, setUser, logout } = useAuth();
  useSystemTheme();

  useEffect(() => {
    if (!token) return;
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => logout());
  }, [token, setUser, logout]);

  return (
    <BrowserRouter>
      <Toaster
        richColors
        position="top-right"
        toastOptions={{ className: "font-medium" }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app" element={<Protected><Chat /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
