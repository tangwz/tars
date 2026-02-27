import { Navigate, Route, Routes } from "react-router-dom";
import { SettingsPage } from "@/pages/SettingsPage";
import { StartupPage } from "@/pages/StartupPage";
import { WorkspacePage } from "@/pages/WorkspacePage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<StartupPage />} path="/" />
      <Route element={<WorkspacePage />} path="/workspace" />
      <Route element={<SettingsPage />} path="/settings" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

