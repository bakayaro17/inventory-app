# Inventory

A clean, cross-platform (Windows + macOS) desktop app to manage personal inventory: shipments received, live inventory, marketplace listings, and an overview with charts. Data syncs through your own free Supabase project, and the installed app updates itself via GitHub Releases.

## Pages

- **Shipment Received** — log each shipment (Date, Retailer, Item name, Quantity).
- **Inventory** — live stock per item, summed from shipments minus what's listed. Items at 0 are hidden until you restock.
- **Listing** — list stock on eBay / Mercari / etc. Listing reduces available inventory.
- **Overview** — Daily / Weekly / Monthly received vs. listed, with pie charts.

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a free Supabase project (your cloud database)

1. Go to [supabase.com](https://supabase.com) → create a project (free tier is fine).
2. In the dashboard, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Open **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **anon public** key

### 3. Run the app

```bash
npm run dev
```

On first launch you'll see a **Connect your inventory** screen. Paste the Project URL and anon key — done. You only do this once per computer, and the same data appears on every machine you connect.

## Building installers

```bash
npm run build:win    # Windows installer (.exe)  -> release/
npm run build:mac    # macOS disk image (.dmg)   -> release/   (build on a Mac)
```

## Auto-update (GitHub Releases)

1. Create a GitHub repo for this app.
2. In [`electron-builder.yml`](electron-builder.yml), set `publish.owner` and `publish.repo`.
3. Publish a release: bump the `version` in `package.json`, then
   ```bash
   set GH_TOKEN=your_github_token   # (Windows)   export GH_TOKEN=... on macOS
   npx electron-builder --win --publish always
   ```
4. Installed apps check GitHub on launch and install updates automatically.

> Auto-update only runs in the **installed/packaged** app, not in `npm run dev`.

## Tech

Electron · React · TypeScript · Vite · Tailwind CSS · Recharts · Supabase · electron-updater
