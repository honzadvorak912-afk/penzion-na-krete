/* =====================================================================
   KONFIGURACE WEBU – Penzion na Krétě
   ---------------------------------------------------------------------
   Klíče Supabase jsou vyplněné – fotogalerie, ceník i heslo se
   synchronizují okamžitě na všech zařízeních.
   ===================================================================== */

window.PENZION_CONFIG = {
  // Z Supabase → Project Settings → API → "Project URL"
  SUPABASE_URL: "https://ueqxkztwgbhgqowugzqn.supabase.co",

  // Z Supabase → Project Settings → API Keys → "Publishable key"
  SUPABASE_ANON_KEY: "sb_publishable_-eOlckyZhQgo4IuCZrupPQ_zbA5HgXj",

  // Názvy tabulek a úložiště. Nech tak, jak je.
  GALLERY_TABLE: "fotky",
  SETTINGS_TABLE: "nastaveni",
  STORAGE_BUCKET: "fotogalerie",
  PRICE_TABLE: "cenik",
  PRICE_NOTES_TABLE: "cenik_poznamky",

  // Výchozí heslo do administrace (po prvním přihlášení si ho změň).
  DEFAULT_ADMIN_PASSWORD: "penzion2024",
};
