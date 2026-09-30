# Sniply ✂️

> **Your developer memory, instant.**  
> Save, search, and copy developer snippets, terminal commands, SQL queries, and AI prompts at the speed of thought.

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)
![Neon](https://img.shields.io/badge/Database-Neon_Postgres-00e599?style=flat&logo=postgresql)
![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-c5f74f?style=flat)
![Shiki](https://img.shields.io/badge/Syntax-Shiki-8b5cf6?style=flat)

---

## ⚡ Highlights & Key Features

* **Instant Server-Side Hydration**:
  * Active code snippets are rendered directly on the server during initial page load.
  * **Zero loading skeleton flicker** on first visit or page reload.
* **0ms In-Memory Snippet Switching**:
  * Complete snippet payloads and tags are pre-fetched into reactive memory.
  * Clicking between snippets in the feed, selecting via `Cmd+K`, or navigating via keyboard switches views with **zero network latency**.
* **Conflict-Free Keyboard-First Workflow**:
  * **`Alt + N`** (or `Option + N` on macOS): Globally opens the Quick Capture modal anywhere without OS/browser `Ctrl+N` window conflicts.
  * **Single-key `N`**: Press `N` while browsing the list to instantly capture a new snippet without touching the mouse.
  * **`Cmd + K` / `Ctrl + K`**: Hybrid client-side Fuse.js fuzzy search across titles, descriptions, and code previews.
  * **`C`**: Copy active snippet code directly to clipboard.
  * **`F`**: Toggle favorite status with instant optimistic feedback.
  * **`E`**: Open the edit modal for the active snippet.
  * **`Cmd + S` / `Ctrl + Enter`**: Fast-save snippet inside the editor.
  * **`↑` / `↓`**: Arrow key navigation through your snippet feed.
* **Smart Auto-Detection & Title Derivation**:
  * Automatically detects snippet types (`terminal`, `code`, `sql`, `prompt`, `regex`, `text`) and languages from syntax patterns.
  * Intelligently derives descriptive titles from commands or comments if left blank.
* **Dynamic Day / Night Theme Switcher**:
  * Adopts your operating system default on initial load.
  * Seamless Sun (Light) and Moon (Dark) toggle without confusing "system" monitor icon states.
* **Hierarchical Folders & Dynamic Real-Time Tags**:
  * Infinitely nested folder hierarchy with zero-refresh parent/child synchronization.
  * Real-time tag counting and automated orphan cleanup — deleting snippets automatically clears unused tags without ghost numbers.
* **Adjustable 3-Column Layout**:
  * Interactive draggable dividers allow customizing panel widths during your session.
  * Clean automatic reset to default proportions on page refresh.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3 (Turbopack, App Router) | React Server Components, Server Actions, Dynamic Streaming |
| **Database** | Neon Serverless Lakebase Postgres | Branchable Postgres with WebSocket pool transactions |
| **ORM** | Drizzle ORM | Type-safe schema, relational joins, and automated migrations |
| **Authentication** | Neon Auth (Managed Better Auth) | Multi-provider OAuth (GitHub & Google) with secure session cookies |
| **Styling** | Tailwind CSS v4 & shadcn/ui | Semantic HSL color tokens, dark mode variants, custom scrollbars |
| **Typography** | Plus Jakarta Sans & JetBrains Mono | Optimized developer typography via `next/font` |
| **Syntax Engine**| Shiki | Dual-theme syntax highlighting (`github-light` / `github-dark-default`) |
| **Search Engine**| Fuse.js | High-performance client-side fuzzy indexing |
| **Toasts** | Sonner | Accessible, non-intrusive action feedback with undo support |

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18.17+ or Node.js 20+
* A [Neon Postgres](https://neon.tech) database project

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/sniply.git
cd sniply
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project:

```env
# Neon Postgres Connection Strings
DATABASE_URL=postgresql://user:password@ep-your-project.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-your-project.us-east-2.aws.neon.tech/neondb?sslmode=require

# Neon Auth (Better Auth) Configuration
NEON_AUTH_BASE_URL=https://ep-your-project.auth.us-east-2.aws.neon.tech
NEON_AUTH_COOKIE_SECRET=your-random-cookie-secret-min-32-chars
```

### 3. Initialize Database Schema

Push the Drizzle ORM schema to your Neon Postgres database:

```bash
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Alt + N` / `⌥ + N` | Global | Open Quick Capture modal (zero browser conflict) |
| `N` | Dashboard (browsing) | Quick capture new snippet |
| `Cmd + K` / `Ctrl + K` | Global | Open Command Search Palette |
| `↑` / `↓` | Snippet Feed | Navigate previous / next snippet |
| `C` | Dashboard (browsing) | Copy active snippet verbatim |
| `F` | Dashboard (browsing) | Toggle snippet favorite |
| `E` | Dashboard (browsing) | Edit active snippet |
| `Cmd + S` / `Ctrl + S` | Modal / Editor | Save snippet |
| `Cmd + Enter` / `Ctrl + ↵` | Modal / Editor | Save and submit snippet |
| `Tab` / `Shift + Tab` | Code Area | Indent / Dedent code by 2 spaces |
| `Esc` | Modals / Palette | Close active overlay |

---

## 📁 Project Architecture

```text
sniply/
├── actions/                  # Next.js Server Actions
│   ├── folders.ts            # Folder CRUD operations
│   └── snippets.ts           # Snippet CRUD, tag associations, & orphan cleanup
├── app/                      # Next.js App Router
│   ├── api/auth/[...path]/   # Neon Auth handler proxy
│   ├── dashboard/            # Authenticated dashboard (server component + SSR)
│   ├── globals.css           # Tailwind v4 theme tokens & custom utilities
│   ├── layout.tsx            # Root layout with fonts & ThemeProvider
│   └── page.tsx              # Landing page with dynamic OAuth detection
├── components/
│   ├── dashboard/            # 3-column workspace components
│   │   ├── dashboard-view.tsx            # Master coordinator & resize state
│   │   ├── edit-snippet-modal.tsx        # In-place snippet editor
│   │   ├── quick-capture-modal.tsx       # Rapid capture dialog with type detection
│   │   ├── resize-handle.tsx             # Interactive column drag divider
│   │   ├── search-palette.tsx            # Cmd+K search overlay
│   │   ├── sidebar.tsx                   # Column 1: Views, folders, tags
│   │   ├── snippet-inspector.tsx         # Column 3: Active code & metadata viewer
│   │   ├── snippet-list.tsx              # Column 2: Snippet feed & cards
│   │   └── snippet-loading-skeleton.tsx  # Exact-silhouette loading skeletons
│   ├── ui/                   # Official shadcn/ui components (Button, Badge, etc.)
│   ├── landing-auth-buttons.tsx # Hero OAuth action triggers
│   ├── landing-navbar.tsx    # Sticky glassmorphic navbar with hover dropdown
│   ├── theme-provider.tsx    # Next-themes provider
│   └── theme-toggle.tsx      # System-aware Day/Night toggle
├── lib/
│   ├── auth/                 # Server & client auth helpers
│   ├── db/                   # Neon database connection & Drizzle schema
│   ├── search/               # Fuse.js search index configuration
│   ├── shiki/                # Dynamic dual-theme syntax highlighter
│   ├── storage/              # IndexedDB local draft outbox
│   └── utils/                # Byte counters, title derivation, & auto-detect
└── drizzle.config.ts         # Drizzle Kit migration configuration
```

---

## 🚢 Production Build

```bash
# Type check
npx tsc --noEmit

# Optimized production build
npm run build

# Start production server
npm run start
```

---

## 📄 License

MIT © [Sniply Team](https://github.com/your-username/sniply)
