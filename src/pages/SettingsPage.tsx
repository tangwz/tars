import { useLocaleStore, localeSelectors } from "@/stores/localeStore";
import { t } from "@/i18n/translate";

export function SettingsPage() {
  const locale = useLocaleStore(localeSelectors.locale);

  return (
    <main className="startup-root">
      <section className="startup-panel">
        <header className="startup-top-row">
          <h1 className="startup-title">{t(locale, "workspace.settings")}</h1>
        </header>
        <p className="muted-text">Settings page placeholder.</p>
      </section>
    </main>
  );
}

