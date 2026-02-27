import { useEffect } from "react";
import { AppRouter } from "@/app/router";
import { useLocaleBootstrap } from "@/hooks/useLocaleBootstrap";
import { useWorkspaceBootstrap } from "@/hooks/useWorkspaceBootstrap";
import { uiSelectors, useUIStore } from "@/stores/uiStore";

function App() {
  const theme = useUIStore(uiSelectors.theme);

  useWorkspaceBootstrap();
  useLocaleBootstrap();

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  return <AppRouter />;
}

export default App;
