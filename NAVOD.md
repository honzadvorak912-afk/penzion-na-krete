# Penzion na Krétě – návod k webu

Web má 5 stránek + administraci:

| Soubor | Stránka |
|---|---|
| `index.html` | Domů |
| `cenik.html` | Ceník |
| `fotogalerie.html` | Fotogalerie |
| `kontakt.html` | Kontakt (formulář přes Formspree) |
| `admin.html` | Administrace fotogalerie (heslo) |

Každá stránka má vlastní CSS (`index.css`, `cenik.css`, …) + sdílené `base.css`.
Společné skripty: `config.js`, `db.js`, `site.js`.

---

## Co funguje hned (bez nastavení)

Stačí soubory nahrát na web (nebo otevřít `index.html`). Web je responzivní,
má burger menu na mobilu, funkční kontaktní formulář a fotogalerii s výchozími
fotkami ze složky `images`.

**Výchozí heslo do administrace:** `penzion2024`
(Otevři `admin.html`. Heslo si po přihlášení změň v sekci „Změna hesla“.)

> ⚠️ Bez Supabase se přidané/odebrané fotky a změněné heslo ukládají **jen
> v daném prohlížeči**, ne na všech zařízeních. Pro synchronizaci na všech
> zařízeních (jako u Uzenin Třebíč) nastav Supabase níže.

---

## Nastavení Supabase (aby se změny projevily HNED na všech zařízeních)

### 1) Založ projekt
1. Jdi na <https://supabase.com> → **Sign in** → **New project**.
2. Zvol název, heslo k databázi a region (Europe). Počkej ~1 min, než se vytvoří.

### 2) Vytvoř tabulky a úložiště
V Supabase otevři **SQL Editor** → **New query**, vlož toto a klikni **Run**:

```sql
-- tabulka fotek
create table fotky (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  path text,
  created_at timestamptz default now()
);

-- tabulka nastavení (heslo)
create table nastaveni (
  klic text primary key,
  hodnota text
);

-- veřejné čtení + zápis (jednoduchá varianta pro malý web)
alter table fotky enable row level security;
alter table nastaveni enable row level security;

create policy "verejne_cteni_fotky" on fotky for select using (true);
create policy "verejny_zapis_fotky" on fotky for insert with check (true);
create policy "verejne_mazani_fotky" on fotky for delete using (true);

create policy "verejne_cteni_nastaveni" on nastaveni for select using (true);
create policy "verejny_zapis_nastaveni" on nastaveni for insert with check (true);
create policy "verejna_zmena_nastaveni" on nastaveni for update using (true);
```

Pak vytvoř úložiště fotek:
1. Vlevo **Storage** → **New bucket**.
2. Název: `fotogalerie`, zaškrtni **Public bucket** → **Save**.

### 3) Zkopíruj klíče do `config.js`
1. Vlevo **Project Settings** (ozubené kolo) → **API**.
2. Zkopíruj **Project URL** a **anon public** klíč.
3. Otevři soubor `config.js` a vlož je:

```js
SUPABASE_URL: "https://tvuj-projekt.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi....(dlouhý klíč)",
```

Ulož soubor. Hotovo! Teď se fotky i heslo ukládají online a změny se
projeví okamžitě na všech zařízeních.

> 💡 Poznámka k bezpečnosti: `anon` klíč je určen do prohlížeče a je v pořádku,
> že je v `config.js`. Politiky výše umožňují komukoli zapisovat – pro malý
> penzionový web je to praktické. Pokud bys chtěl přísnější zabezpečení
> (např. mazání jen pro přihlášené), dej vědět.

---

## Změna hesla
Otevři `admin.html` → přihlas se → sekce **Změna hesla**.
Po nastavení Supabase platí nové heslo na všech zařízeních.

## Kontaktní formulář
Formulář na stránce `kontakt.html` posílá zprávy přes Formspree na endpoint
`https://formspree.io/f/xgobdvwj`. Zprávy ti chodí do tvého Formspree účtu.

## Nahrání na web
Nahraj celou složku (všechny `.html`, `.css`, `.js`, soubor `config.js`,
`NAVOD.md` a složku `images`) na svůj hosting. Hlavní stránka je `index.html`.
