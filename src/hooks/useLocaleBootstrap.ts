import { useEffect } from "react";
import { getMeta, setMeta } from "@/services/persistence/projectRepository";
import { isLocale, type Locale } from "@/i18n/types";
import { localeSelectors, useLocaleStore } from "@/stores/localeStore";
import { useUIStore } from "@/stores/uiStore";
import { useWorkspaceStore, workspaceSelectors } from "@/stores/workspaceStore";

const UI_LOCALE_META_KEY = "ui_locale";

function resolveDefaultLocale(savedLocale: string | null): Locale {
  if (savedLocale && isLocale(savedLocale)) {
    return savedLocale;
  }

  const systemLocale = typeof navigator === "undefined" ? "en" : navigator.language;

  if (systemLocale.toLowerCase().startsWith("zh")) {
    return "zh-CN";
  }

  return "en";
}

export function useLocaleBootstrap() {
  const isDatabaseReady = useWorkspaceStore(workspaceSelectors.isDatabaseReady);
  const locale = useLocaleStore(localeSelectors.locale);
  const isLocaleBootstrapped = useLocaleStore(localeSelectors.isLocaleBootstrapped);

  useEffect(() => {
    if (!isDatabaseReady || isLocaleBootstrapped) {
      return;
    }

    let active = true;

    const bootstrapLocale = async () => {
      try {
        const savedLocale = await getMeta(UI_LOCALE_META_KEY);

        if (!active) {
          return;
        }

        useLocaleStore.getState().setLocale(resolveDefaultLocale(savedLocale));
        useLocaleStore.getState().setLocaleBootstrapped(true);
      } catch (error) {
        useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
      }
    };

    void bootstrapLocale();

    return () => {
      active = false;
    };
  }, [isDatabaseReady, isLocaleBootstrapped]);

  useEffect(() => {
    if (!isDatabaseReady || !isLocaleBootstrapped) {
      return;
    }

    void setMeta(UI_LOCALE_META_KEY, locale).catch((error) => {
      useUIStore.getState().setStartupError(error instanceof Error ? error.message : String(error));
    });
  }, [isDatabaseReady, isLocaleBootstrapped, locale]);
}

