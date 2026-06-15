/* =====================================================================
   db.js – vrstva pro práci se Supabase (fotky, ceník, heslo)
   ===================================================================== */
(function () {
  const C = window.PENZION_CONFIG || {};
  const DEFAULT_PHOTOS = [];
  const hasSupabase = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);

  let _client = null;
  async function client() {
    if (!hasSupabase) return null;
    if (_client) return _client;
    if (!window.supabase) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    _client = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
    return _client;
  }

  const DEFAULT_PRICES = [
    { popis: "1lůžkový pokoj", cena: "800 Kč" },
    { popis: "2lůžkový pokoj", cena: "1 200 Kč" },
    { popis: "3lůžkový pokoj", cena: "1 500 Kč" },
  ];
  const DEFAULT_NOTES = [
    { ikona: "✔", text: "Děti do 6 let (na přistýlce) <strong>zdarma</strong>." },
    { ikona: "🐾", text: "Mazlíček na pokoji (pes, kočka, nejedovatý nebo neškrtící had) <strong>+ 300 Kč / noc</strong>." },
    { ikona: "🎟️", text: "V době konání sportovních a společenských akcí cena dohodou." },
    { ikona: "ℹ", text: "Od 1. 7. 2023 zavedlo Statutární město Pardubice <strong>poplatek z pobytu 30 Kč / osoba / noc</strong>, který není zahrnut v ceně." },
  ];

  // Vrátí nejvyšší poradi+1 v dané tabulce (malé celé číslo)
  async function nextPoradi(table) {
    try {
      const sb = await client();
      const { data } = await sb.from(table).select("poradi").order("poradi", { ascending: false }).limit(1);
      const max = (data && data[0] && Number(data[0].poradi)) || 0;
      return max + 1;
    } catch (e) { return 1; }
  }

  const DB = {
    isConfigured: hasSupabase,

    async getPhotos() {
      if (!hasSupabase) return DEFAULT_PHOTOS.map((url, i) => ({ id: "default-" + i, url, path: null }));
      try {
        const sb = await client();
        const { data, error } = await sb.from(C.GALLERY_TABLE).select("*").order("created_at", { ascending: false });
        if (error) throw error;
        if (!data || data.length === 0) return DEFAULT_PHOTOS.map((url, i) => ({ id: "default-" + i, url, path: null }));
        return data.map((r) => ({ id: r.id, url: r.url, path: r.path }));
      } catch (e) { console.warn("getPhotos:", e); return DEFAULT_PHOTOS.map((url, i) => ({ id: "default-" + i, url, path: null })); }
    },
    async addPhoto(file) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = "foto_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8) + "." + ext;
      const { error: upErr } = await sb.storage.from(C.STORAGE_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from(C.STORAGE_BUCKET).getPublicUrl(path);
      const { error: insErr } = await sb.from(C.GALLERY_TABLE).insert({ url: pub.publicUrl, path });
      if (insErr) throw insErr;
      return { url: pub.publicUrl, path };
    },
    async deletePhoto(photo) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      if (photo.path) await sb.storage.from(C.STORAGE_BUCKET).remove([photo.path]);
      const { error } = await sb.from(C.GALLERY_TABLE).delete().eq("id", photo.id);
      if (error) throw error;
    },

    async getPassword() {
      if (!hasSupabase) return localStorage.getItem("penzion_admin_pwd") || C.DEFAULT_ADMIN_PASSWORD;
      try {
        const sb = await client();
        const { data, error } = await sb.from(C.SETTINGS_TABLE).select("hodnota").eq("klic", "admin_heslo").maybeSingle();
        if (error) throw error;
        return (data && data.hodnota) || C.DEFAULT_ADMIN_PASSWORD;
      } catch (e) { console.warn("getPassword:", e); return localStorage.getItem("penzion_admin_pwd") || C.DEFAULT_ADMIN_PASSWORD; }
    },
    async setPassword(newPwd) {
      if (!hasSupabase) { localStorage.setItem("penzion_admin_pwd", newPwd); return; }
      const sb = await client();
      const { error } = await sb.from(C.SETTINGS_TABLE).upsert({ klic: "admin_heslo", hodnota: newPwd }, { onConflict: "klic" });
      if (error) throw error;
    },

    // Pokud je tabulka prázdná, vloží výchozí hodnoty (aby je šlo v adminu upravovat)
    async seedPricesIfEmpty() {
      if (!hasSupabase) return;
      const sb = await client();
      const { data } = await sb.from(C.PRICE_TABLE).select("id").limit(1);
      if (data && data.length) return;
      const rows = DEFAULT_PRICES.map((p, i) => ({ popis: p.popis, cena: p.cena, poradi: i + 1 }));
      await sb.from(C.PRICE_TABLE).insert(rows);
    },
    async seedNotesIfEmpty() {
      if (!hasSupabase) return;
      const sb = await client();
      const { data } = await sb.from(C.PRICE_NOTES_TABLE).select("id").limit(1);
      if (data && data.length) return;
      const rows = DEFAULT_NOTES.map((p, i) => ({ ikona: p.ikona, text: p.text, poradi: i + 1 }));
      await sb.from(C.PRICE_NOTES_TABLE).insert(rows);
    },

    async getPrices() {
      if (!hasSupabase) return DEFAULT_PRICES.map((p, i) => ({ id: "d" + i, ...p }));
      try {
        const sb = await client();
        const { data, error } = await sb.from(C.PRICE_TABLE).select("*").order("poradi", { ascending: true }).order("created_at", { ascending: true });
        if (error) throw error;
        if (!data || !data.length) return DEFAULT_PRICES.map((p, i) => ({ id: "d" + i, ...p }));
        return data;
      } catch (e) { console.warn("getPrices:", e); return DEFAULT_PRICES.map((p, i) => ({ id: "d" + i, ...p })); }
    },
    async addPrice(popis, cena) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const poradi = await nextPoradi(C.PRICE_TABLE);
      const { error } = await sb.from(C.PRICE_TABLE).insert({ popis, cena, poradi });
      if (error) throw error;
    },
    async updatePrice(id, popis, cena) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const { error } = await sb.from(C.PRICE_TABLE).update({ popis, cena }).eq("id", id);
      if (error) throw error;
    },
    async deletePrice(id) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const { error } = await sb.from(C.PRICE_TABLE).delete().eq("id", id);
      if (error) throw error;
    },

    async getNotes() {
      if (!hasSupabase) return DEFAULT_NOTES.map((p, i) => ({ id: "d" + i, ...p }));
      try {
        const sb = await client();
        const { data, error } = await sb.from(C.PRICE_NOTES_TABLE).select("*").order("poradi", { ascending: true }).order("created_at", { ascending: true });
        if (error) throw error;
        if (!data || !data.length) return DEFAULT_NOTES.map((p, i) => ({ id: "d" + i, ...p }));
        return data;
      } catch (e) { console.warn("getNotes:", e); return DEFAULT_NOTES.map((p, i) => ({ id: "d" + i, ...p })); }
    },
    async addNote(ikona, text) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const poradi = await nextPoradi(C.PRICE_NOTES_TABLE);
      const { error } = await sb.from(C.PRICE_NOTES_TABLE).insert({ ikona: ikona || "", text, poradi });
      if (error) throw error;
    },
    async updateNote(id, ikona, text) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const { error } = await sb.from(C.PRICE_NOTES_TABLE).update({ ikona: ikona || "", text }).eq("id", id);
      if (error) throw error;
    },
    async deleteNote(id) {
      if (!hasSupabase) throw new Error("Supabase není nastaven.");
      const sb = await client();
      const { error } = await sb.from(C.PRICE_NOTES_TABLE).delete().eq("id", id);
      if (error) throw error;
    },
  };

  window.DB = DB;
})();
