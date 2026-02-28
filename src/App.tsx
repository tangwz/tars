import { useEffect } from "react";
import { AppRouter } from "@/app/router";
import { useLocaleBootstrap } from "@/hooks/useLocaleBootstrap";
import { isMacDesktop } from "@/lib/platform/isMacDesktop";
import { useWorkspaceBootstrap } from "@/hooks/useWorkspaceBootstrap";
import { uiSelectors, useUIStore } from "@/stores/uiStore";

function App() {
  const theme = useUIStore(uiSelectors.theme);
  const isMacOverlayTitlebar = isMacDesktop();

  useWorkspaceBootstrap();
  useLocaleBootstrap();

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("platform-macos-overlay-titlebar", isMacOverlayTitlebar);

    return () => {
      document.documentElement.classList.remove("platform-macos-overlay-titlebar");
    };
  }, [isMacOverlayTitlebar]);

  return <AppRouter />;
}

export default App;
