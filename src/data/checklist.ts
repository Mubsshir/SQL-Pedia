import { ChecklistItem } from '../types';

export const REVIEW_CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'chk-no-select-star',
    category: 'Performance',
    title: 'No unnecessary SELECT *',
    description: 'All queries, views, and procedures enumerate explicit column lists to allow covering index seeks and prevent payload bloat.',
    critical: true
  },
  {
    id: 'chk-sargable-predicates',
    category: 'Performance',
    title: 'SARGable WHERE predicates verified',
    description: 'No functions (YEAR, CONVERT, LEFT) applied to indexed columns in WHERE or JOIN conditions.',
    critical: true
  },
  {
    id: 'chk-indexes-reviewed',
    category: 'Performance',
    title: 'Proper indexes considered & seeks verified',
    description: 'Estimated or actual execution plan reviewed in SSMS/Azure Data Studio to confirm Index Seeks instead of Table Scans.',
    critical: false
  },
  {
    id: 'chk-implicit-conversions',
    category: 'Performance',
    title: 'Data type matching (no implicit conversion scans)',
    description: 'Parameters and variable types match table column definitions exactly (e.g. VARCHAR vs NVARCHAR).',
    critical: true
  },
  {
    id: 'chk-where-clause-verified',
    category: 'Safety & Concurrency',
    title: 'WHERE clause verified on UPDATE / DELETE',
    description: 'All UPDATE and DELETE statements were previewed with a SELECT query first and contain strict WHERE conditions.',
    critical: true
  },
  {
    id: 'chk-join-conditions-cartesian',
    category: 'Correctness & Logic',
    title: 'JOIN conditions verified (no Cartesian product)',
    description: 'All JOIN clauses have explicit ON conditions matching primary/foreign keys. No inadvertent CROSS JOIN multiplier.',
    critical: true
  },
  {
    id: 'chk-null-handling',
    category: 'Correctness & Logic',
    title: 'NULL handling & Three-Valued Logic checked',
    description: 'Conditions handle NULLs properly (IS NULL, IS NOT NULL, NOT EXISTS instead of NOT IN).',
    critical: false
  },
  {
    id: 'chk-transaction-scope',
    category: 'Safety & Concurrency',
    title: 'Transaction scope is minimal & clean',
    description: 'Transactions only encompass the immediate write statements. No data prep or network latency inside BEGIN TRAN.',
    critical: true
  },
  {
    id: 'chk-error-handling-throw',
    category: 'Safety & Concurrency',
    title: 'Error handling with TRY...CATCH & THROW',
    description: 'Procedures implement standard TRY/CATCH blocks with XACT_STATE() checks and re-throw errors.',
    critical: false
  },
  {
    id: 'chk-large-table-batching',
    category: 'Safety & Concurrency',
    title: 'Large-table impact considered (Batching)',
    description: 'Deletions or updates over 5,000 rows use iterative batching to avoid lock escalation to full table locks.',
    critical: true
  },
  {
    id: 'chk-two-part-naming',
    category: 'Style & Standards',
    title: 'Two-part object naming (schema.table)',
    description: 'All referenced tables, views, and procedures use two-part naming (e.g. dbo.Customer).',
    critical: false
  },
  {
    id: 'chk-set-nocount-on',
    category: 'Style & Standards',
    title: 'SET NOCOUNT ON present in procedures',
    description: 'Procedure begins with SET NOCOUNT ON to prevent network traffic for row count messages.',
    critical: false
  },
  {
    id: 'chk-semicolon-termination',
    category: 'Style & Standards',
    title: 'Statements terminated with semicolons',
    description: 'All T-SQL statements are properly terminated with semicolons (;).',
    critical: false
  }
];
