import { QuerySnippet } from '../../types';

export const bestPracticesQueries: QuerySnippet[] = [
  {
    id: 'sargable-predicates-pattern',
    title: 'SARGable Date & Column Predicates (Index Seek Guarantee)',
    category: 'Best Practices',
    subcategory: 'Query Optimization',
    description: 'Ensure WHERE clauses are SARGable (Search Argument Able) so the query engine can perform efficient Index Seeks instead of full Index/Table Scans.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['sargable', 'index-seek', 'year', 'convert', 'performance', 'scans'],
    featured: true,
    whenToUse: 'Whenever writing date filters or comparing indexed columns.',
    sql: `-- ❌ BAD: Non-SARGable (Forces full Index/Table Scan across every single row)
SELECT OrderId, CustomerId, OrderTotal
FROM dbo.Orders
WHERE YEAR(OrderDate) = 2026;

-- ✅ BETTER: SARGable Range (Enables high-speed Index Seek on OrderDate)
SELECT OrderId, CustomerId, OrderTotal
FROM dbo.Orders
WHERE OrderDate >= '2026-01-01'
  AND OrderDate <  '2027-01-01';

-- ----------------------------------------------------
-- String Manipulation Example:
-- ----------------------------------------------------
-- ❌ BAD: Function on column disables index
SELECT CustomerId, LastName 
FROM dbo.Customer 
WHERE LEFT(LastName, 3) = 'Smi';

-- ✅ BETTER: Trailing wildcard enables index seek
SELECT CustomerId, LastName 
FROM dbo.Customer 
WHERE LastName LIKE 'Smi%';`,
    notes: [
      'Applying any function (YEAR, MONTH, DATEADD, CONVERT, LEFT, UPPER) to an indexed column in the WHERE clause prevents the optimizer from doing an Index Seek.',
      'Always apply functions to the constant or parameter side of the comparison, never to the column side.'
    ],
    relatedQueryIds: ['dynamic-sql-with-sp-executesql', 'exists-vs-in-null-safe']
  },
  {
    id: 'dynamic-sql-with-sp-executesql',
    title: 'Safe Dynamic SQL with sp_executesql & QUOTENAME',
    category: 'Best Practices',
    subcategory: 'Dynamic SQL Safety',
    description: 'Protect against SQL injection and maximize query plan reuse by using sp_executesql with strongly typed parameters and QUOTENAME for identifiers.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['dynamic-sql', 'sp_executesql', 'quotename', 'sql-injection', 'plan-cache'],
    featured: true,
    whenToUse: 'When dynamic column filtering or dynamic table names are strictly necessary.',
    sql: `-- ❌ DANGEROUS: String concatenation opens SQL Injection vulnerabilities!
-- EXEC('SELECT * FROM dbo.Customer WHERE LastName = ''' + @UserFilter + '''');

-- ✅ SECURE & EFFICIENT: Parameterized dynamic SQL using sp_executesql
DECLARE @SchemaName SYSNAME = N'dbo';
DECLARE @TableName SYSNAME = N'Customer';
DECLARE @StatusFilter VARCHAR(20) = 'Active';
DECLARE @MinCreatedDate DATETIME2 = '2026-01-01';

-- 1. Use QUOTENAME for schema and table identifiers to prevent injection
DECLARE @SqlStatement NVARCHAR(MAX) = N'
    SELECT CustomerId, FirstName, LastName, CreatedDate
    FROM ' + QUOTENAME(@SchemaName) + '.' + QUOTENAME(@TableName) + N'
    WHERE AccountStatus = @InnerStatus
      AND CreatedDate >= @InnerDate;';

-- 2. Define strongly typed parameter declaration string
DECLARE @ParamDefinition NVARCHAR(500) = N'
    @InnerStatus VARCHAR(20),
    @InnerDate DATETIME2';

-- 3. Execute with safe parameterized inputs
EXEC sys.sp_executesql 
    @stmt = @SqlStatement,
    @params = @ParamDefinition,
    @InnerStatus = @StatusFilter,
    @InnerDate = @MinCreatedDate;`,
    notes: [
      'QUOTENAME automatically encloses identifiers in square brackets and escapes embedded closing brackets.',
      'sp_executesql caches and reuses execution plans across different parameter values, drastically saving compilation CPU.'
    ],
    relatedQueryIds: ['procedure-error-handling-template']
  },
  {
    id: 'exists-vs-in-null-safe',
    title: 'EXISTS vs IN (NULL Handling & Performance)',
    category: 'Best Practices',
    subcategory: 'Query Optimization',
    description: 'Understand the critical distinction between NOT EXISTS and NOT IN when the subquery contains NULL values.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['exists', 'in', 'not-exists', 'not-in', 'null-safety', 'three-valued-logic'],
    whenToUse: 'Filtering rows based on child table existence without falling victim to three-valued logic bugs.',
    sql: `-- ⚠️ HAZARD: If subquery returns even ONE NULL value, NOT IN evaluates to UNKNOWN and returns ZERO rows!
-- SELECT CustomerId, Email
-- FROM dbo.Customer
-- WHERE CustomerId NOT IN (SELECT CustomerId FROM dbo.BlacklistedCustomer);

-- ✅ SAFE & FAST: NOT EXISTS handles NULLs correctly and short-circuits on first match
SELECT c.CustomerId, c.Email
FROM dbo.Customer c
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.BlacklistedCustomer b
    WHERE b.CustomerId = c.CustomerId
);

-- For positive matching (EXISTS vs IN):
-- Both usually produce identical query optimizer plans, but EXISTS is generally preferred in enterprise standards.`,
    notes: [
      'In SQL three-valued logic: X IN (1, 2, NULL) is TRUE if X in (1,2), but UNKNOWN if X = 3.',
      'NOT (UNKNOWN) remains UNKNOWN. Hence NOT IN returns 0 rows if any NULL is present in the subquery.'
    ],
    relatedQueryIds: ['sargable-predicates-pattern']
  },
  {
    id: 'union-vs-union-all',
    title: 'UNION ALL vs UNION (Eliminate Redundant Sorts)',
    category: 'Best Practices',
    subcategory: 'Query Optimization',
    description: 'Always prefer UNION ALL over UNION unless distinct deduplication is strictly necessary, eliminating costly Sort operations.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['union', 'union-all', 'sort', 'deduplication', 'performance'],
    whenToUse: 'Combining result sets from multiple tables or historical partitions.',
    sql: `-- ❌ SLOWER: UNION performs a DISTINCT sort operation across all combined rows
SELECT OrderId, CustomerId, OrderTotal FROM dbo.ActiveOrders
UNION
SELECT OrderId, CustomerId, OrderTotal FROM dbo.ArchivedOrders;

-- ✅ FASTER: UNION ALL simply concatenates result sets with ZERO sort overhead
SELECT OrderId, CustomerId, OrderTotal FROM dbo.ActiveOrders
UNION ALL
SELECT OrderId, CustomerId, OrderTotal FROM dbo.ArchivedOrders;`,
    notes: [
      'If the two sets are inherently disjoint (e.g. Active vs Archive), UNION is purely wasting CPU and memory on a distinct sort.'
    ],
    relatedQueryIds: ['sargable-predicates-pattern']
  },
  {
    id: 'nolock-risks-and-alternatives',
    title: 'NOLOCK Pitfalls & Read Committed Snapshot (RCSI)',
    category: 'Best Practices',
    subcategory: 'Concurrency & Locking',
    description: 'Learn why WITH (NOLOCK) causes duplicate rows, skipped rows, and dirty reads, and how RCSI solves concurrency cleanly.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['nolock', 'readuncommitted', 'rcsi', 'dirty-reads', 'snapshot-isolation'],
    whenToUse: 'When developers are tempted to sprinkle NOLOCK across queries to avoid blocking.',
    sql: `-- ⚠️ DIRTY READ HAZARD: WITH (NOLOCK) can read uncommitted data that gets rolled back,
-- and can cause identical rows to be returned TWICE or skipped due to concurrent page splits!
SELECT CustomerId, AccountBalance 
FROM dbo.Customer WITH (NOLOCK)
WHERE CustomerId = 1042;

-- ✅ MODERN SOLUTION: Enable READ_COMMITTED_SNAPSHOT (RCSI) at the database level.
-- Readers do not block writers, writers do not block readers, and queries NEVER read dirty uncommitted data!
-- (DBA executed once on database):
-- ALTER DATABASE CurrentDatabaseName 
-- SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;`,
    notes: [
      'NOLOCK is not an optimization tool — it is an isolation level change that sacrifices transactional integrity.',
      'Under NOLOCK, if an allocation page split occurs while an index scan is running, the query can read the same row twice or miss rows entirely.'
    ],
    relatedQueryIds: ['blocking-sessions']
  }
];
