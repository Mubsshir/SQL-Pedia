# Company — Enterprise SQL Developer Platform & Toolkit

> **Central SQL Server knowledge hub and engineering toolkit for all teams across Company (DBAs, Developers, Data Engineers, Analysts, QA, and DevOps).**
> A purpose-built developer platform for fast query discovery, stored procedure boilerplate generation, side-by-side SQL code diffing, smart meter JSON formatting, and official DB Guidelines compliance.

---

## ⚡ Core Developer Experience

```text
Ctrl + K  →  Instant search across 84+ queries, guidelines, partitions, DMVs
Header    →  Jump to DB Guidelines, Boilerplate SPs, SQL Compare, JSON Formatter
Sidebar   →  Switch between categories, tools, standards, and checklists
```

---

## 🚀 Key Features & Built-in Tools

* **Company Brand & Green/White Theme**: Custom logo mark, tailored emerald and slate styling, light and dark mode toggle.
* **Official DB Guidelines Document**: Loaded directly from company master Excel with 17 Stored Procedure rules (`t_job_error`, `(NOLOCK)`, `SET NOCOUNT ON`), table prefix directory (`M_`, `L_`, `T_`, `S_`, `R_`), standard table aliases, and annual partition archival runbook.
* **Stored Procedure Boilerplate Generator**:
  * **Report SP (`usp_rep_*`)**: Incorporates the exact production template for Feeder IP/LS/Event data coverage, login hierarchy parameters, pagination, and open-ended date filtering.
  * **Import / Data Movement SP (`usp_import_*`)**: Features `mdms_stg.dbo.[m_max_movedata]` watermark tracking (`payload_id`), `IDENT_CURRENT` evaluation, and centralized `t_job_error` error auditing with `RAISERROR WITH NOWAIT`.
  * **Transactional SP (`usp_txn_*`)**: Full `XACT_STATE()`, `SAVE TRANSACTION`, and atomic rollback.
  * **Staging Bulk Merge (`usp_stg_*`)**: Deduplication CTE with `ROW_NUMBER()` and batch upsert.
* **SQL Code Compare & Diff Analyzer**: Side-by-side and unified diff views comparing two SQL scripts, highlighting additions (`+`), removals (`-`), similarity percentages, and whitespace handling.
* **JSON Formatter & T-SQL `OPENJSON` Generator**: Beautify (2/4 spaces), minify, real-time syntax validator, and automatic generation of SQL Server `OPENJSON(...) WITH (...)` queries for smart meter payloads (MDMS/HES).
* **84+ Production-Tested Queries**: Performance & DMVs, Table Partitioning, Stored Procedures, SQL Server Agent, Tables & Schema DDL, Data Operations (DML), Developer Utilities, Database Administration, Troubleshooting, and Best Practices.

---

## 🛠️ Quick Start

```bash
# Navigate to project directory
cd /home/redflower/.gemini/antigravity/scratch/tsql-toolkit

# Install dependencies (already installed)
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📁 Codebase Architecture

```text
src/
├── types/
│   └── index.ts                 # Core TypeScript interfaces (QuerySnippet, SqlTip, etc.)
├── utils/
│   ├── sqlHighlighter.ts        # Fast, zero-dependency T-SQL syntax tokenizer
│   ├── sqlFormatter.ts          # Client-side query formatter (uppercase, indentation)
│   ├── searchEngine.ts          # Weighted multi-field search engine
│   └── dateUtils.ts             # Relative time formatting
├── hooks/
│   ├── useFavorites.ts          # LocalStorage-backed starred queries
│   ├── useRecentlyViewed.ts     # LocalStorage-backed recent query tracker
│   ├── useChecklist.ts          # LocalStorage-backed PR checklist state
│   └── useKeyboardShortcuts.ts  # Global listener for Ctrl+K, Esc, ?
├── data/
│   ├── categories.ts            # Category metadata and icons
│   ├── queries/                 # 84 modular production T-SQL snippets
│   │   ├── performance.ts
│   │   ├── partitioning.ts
│   │   ├── storedProcedures.ts
│   │   ├── sqlAgent.ts
│   │   ├── tablesSchema.ts
│   │   ├── dataOperations.ts
│   │   ├── developerUtils.ts
│   │   ├── databaseAdmin.ts
│   │   ├── troubleshooting.ts
│   │   └── bestPractices.ts
│   ├── queriesIndex.ts          # Central index and query lookup functions
│   ├── tips.ts                  # Problem → Why → Solution → Examples
│   ├── standards.ts             # Team naming and transaction rules
│   └── checklist.ts             # Pre-deployment review items
├── components/
│   ├── CodeBlock.tsx            # SQL editor code display with syntax highlighting
│   ├── SearchModal.tsx          # Ctrl+K modal with arrow key navigation
│   ├── Sidebar.tsx              # Category and knowledge navigation
│   ├── Header.tsx               # Brand, search trigger, and quick links
│   ├── QueryCard.tsx            # Query card with quick-copy & favorites
│   ├── WarningBanner.tsx        # Risk level banner
│   ├── ParameterEditor.tsx      # Live parameter substitution inputs
│   └── KeyboardShortcutsModal.tsx # Keyboard shortcuts cheat sheet
└── pages/
    ├── DashboardPage.tsx        # Quick Actions grid and team stats
    ├── BrowsePage.tsx           # Multi-category filterable query library
    ├── QueryDetailPage.tsx      # In-depth query analysis, results schema & editor
    ├── FavoritesPage.tsx        # Starred queries
    ├── RecentlyViewedPage.tsx   # History timeline
    ├── PlaygroundPage.tsx       # Client-side SQL formatter and scratchpad
    ├── TipsPage.tsx             # 💡 Developer Tips deck
    ├── StandardsPage.tsx        # Team coding standards reference
    └── ChecklistPage.tsx        # Interactive code review checklist
```

---

## ➕ Adding New Queries

To add a query, simply add an object to the corresponding category file in `src/data/queries/`:

```typescript
{
  id: 'unique-query-id',
  title: 'Descriptive Title',
  category: 'Performance',
  description: 'What the query accomplishes.',
  sql: `SELECT ...`,
  difficulty: 'Intermediate',
  risk: 'safe', // 'safe' | 'caution' | 'destructive'
  sqlServerVersion: '2016+',
  tags: ['tag1', 'tag2'],
  whenToUse: 'Operational context.',
  parameters: [
    { name: 'TableName', placeholder: "'dbo.MyTable'", description: 'Target table', defaultValue: "'dbo.MyTable'" }
  ],
  columnsReturned: [
    { name: 'Col1', description: 'Description' }
  ],
  notes: ['Key caveat or tip'],
  relatedQueryIds: ['other-query-id']
}
```
