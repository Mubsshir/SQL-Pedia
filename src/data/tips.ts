import { SqlTip } from '../types';

export const SQL_TIPS: SqlTip[] = [
  {
    id: 'sargable-dates',
    title: 'Never Wrap Indexed Columns in Functions in WHERE Clauses',
    category: 'Performance',
    problem: 'Using functions like YEAR(OrderDate) = 2026 in the WHERE clause.',
    why: 'Functions on columns destroy SARGability (Search Argument Ability). The query optimizer cannot perform an Index Seek along the B-Tree index; instead, it must evaluate the function on every single row in the table, resulting in a full table/index scan.',
    betterApproach: 'Rewrite the condition as an open-ended range comparison against literal or parameter values on the right-hand side.',
    badCode: `-- ❌ Destroys index seek:
SELECT OrderId, CustomerId, TotalAmount 
FROM dbo.Orders 
WHERE YEAR(OrderDate) = 2026;`,
    goodCode: `-- ✅ SARGable: Enables high-speed index seek
SELECT OrderId, CustomerId, TotalAmount 
FROM dbo.Orders 
WHERE OrderDate >= '2026-01-01' 
  AND OrderDate <  '2027-01-01';`,
    tags: ['sargability', 'index-seek', 'dates', 'scans']
  },
  {
    id: 'avoid-select-star',
    title: 'Avoid SELECT * in Production Queries',
    category: 'Performance & Architecture',
    problem: 'Using SELECT * in application queries, views, or stored procedures.',
    why: 'SELECT * fetches unused columns (including wide LOB text or binary columns), drastically increases network TDS payload size, wastes client memory, and prevents the query optimizer from leveraging Covering Indexes (which only need the specific indexed columns). It also causes runtime breakage if table schemas change.',
    betterApproach: 'Always specify the exact explicit column list required by the caller.',
    badCode: `-- ❌ Fetches all columns including unused MAX/LOB data:
SELECT * 
FROM dbo.Customer
WHERE CustomerId = 1042;`,
    goodCode: `-- ✅ Precise column selection enables index-only covering seeks:
SELECT CustomerId, FirstName, LastName, Email 
FROM dbo.Customer 
WHERE CustomerId = 1042;`,
    tags: ['select-star', 'covering-index', 'network-io', 'best-practices']
  },
  {
    id: 'nolock-misuse',
    title: 'Be Careful with WITH (NOLOCK) — It is Not a Free Speedup',
    category: 'Concurrency',
    problem: 'Blindly adding WITH (NOLOCK) to every SELECT statement to bypass blocking.',
    why: 'NOLOCK enables READ UNCOMMITTED isolation. It can read uncommitted dirty data that subsequently rolls back. Worse, during concurrent page splits, index scans with NOLOCK can return the exact same row twice or completely skip rows without throwing any warning or error.',
    betterApproach: 'For read concurrency without blocking, enable READ_COMMITTED_SNAPSHOT (RCSI) at the database level. Queries read row-versioned committed data without blocking writers or reading dirty rows.',
    badCode: `-- ❌ Can return phantom rows or miss rows during page splits:
SELECT AccountId, Balance 
FROM dbo.BankAccount WITH (NOLOCK) 
WHERE AccountId = 445;`,
    goodCode: `-- ✅ Best: Enable RCSI at database level, then use standard READ COMMITTED:
-- ALTER DATABASE MyDB SET READ_COMMITTED_SNAPSHOT ON;
SELECT AccountId, Balance 
FROM dbo.BankAccount 
WHERE AccountId = 445;`,
    tags: ['nolock', 'dirty-reads', 'concurrency', 'rcsi']
  },
  {
    id: 'implicit-conversion-scan',
    title: 'Beware Implicit Conversions Between VARCHAR and NVARCHAR',
    category: 'Performance',
    problem: 'Passing an NVARCHAR parameter (e.g. from .NET/Java ORM) into a query filtering a VARCHAR column.',
    why: 'According to SQL Server data type precedence, VARCHAR has lower precedence than NVARCHAR. The engine converts the column value to NVARCHAR on every row: CONVERT_IMPLICIT(nvarchar(50), [ColumnName], 0) = @Param. This converts an index seek into an expensive full index scan!',
    betterApproach: 'Ensure parameter data types match the table column data type exactly.',
    badCode: `-- ❌ When @UserCode is NVARCHAR, engine converts every table row to NVARCHAR:
DECLARE @UserCode NVARCHAR(50) = N'USR-992';
SELECT UserId FROM dbo.Users WHERE UserCode = @UserCode; -- UserCode is VARCHAR(50)`,
    goodCode: `-- ✅ Matching data types preserve index seek:
DECLARE @UserCode VARCHAR(50) = 'USR-992';
SELECT UserId FROM dbo.Users WHERE UserCode = @UserCode;`,
    tags: ['implicit-conversion', 'data-types', 'scans', 'index-seek']
  },
  {
    id: 'parameter-sniffing-mitigation',
    title: 'Mitigate Parameter Sniffing in Stored Procedures',
    category: 'Performance',
    problem: 'A stored procedure runs fast for some parameter values but times out for others.',
    why: 'On first execution, SQL Server compiles the plan optimized for the specific parameter value supplied (sniffed parameter). If subsequent executions have vastly different data distributions (e.g. 5 rows vs 500,000 rows), the cached plan causes disastrous scans or spills.',
    betterApproach: 'Use OPTION (RECOMPILE) for ad-hoc batch reports, copy parameters to local variables, or use OPTION (OPTIMIZE FOR (@Param = ...)) for predictable median distributions.',
    badCode: `-- ❌ Procedure suffers if compiled with non-representative parameter:
CREATE OR ALTER PROCEDURE dbo.GetOrdersByStatus @StatusId INT
AS
    SELECT * FROM dbo.Orders WHERE StatusId = @StatusId;`,
    goodCode: `-- ✅ Option A: Local variable masks parameter sniffing:
CREATE OR ALTER PROCEDURE dbo.GetOrdersByStatus @StatusId INT
AS
    DECLARE @LocalStatusId INT = @StatusId;
    SELECT OrderId, CustomerId FROM dbo.Orders WHERE StatusId = @LocalStatusId;

-- ✅ Option B: OPTION (RECOMPILE) for variable-distribution queries:
-- SELECT OrderId, CustomerId FROM dbo.Orders WHERE StatusId = @StatusId OPTION (RECOMPILE);`,
    tags: ['parameter-sniffing', 'plan-cache', 'recompile', 'optimization']
  },
  {
    id: 'dynamic-sql-injection-quotename',
    title: 'Always Use sp_executesql and QUOTENAME for Dynamic SQL',
    category: 'Security & Performance',
    problem: 'Constructing dynamic queries by concatenating raw strings with EXEC(@sql).',
    why: 'String concatenation introduces critical SQL Injection vulnerabilities and floods the plan cache with single-use ad-hoc query plans, exhausting server memory.',
    betterApproach: 'Use sys.sp_executesql with strongly typed input parameters and wrap all object/column identifiers with QUOTENAME().',
    badCode: `-- ❌ Vulnerable to SQL Injection and thrashes plan cache:
DECLARE @Sql VARCHAR(1000) = 'SELECT * FROM dbo.Users WHERE UserName = ''' + @Input + '''';
EXEC(@Sql);`,
    goodCode: `-- ✅ Safe, parameterized, and reuses compiled execution plans:
DECLARE @Sql NVARCHAR(MAX) = N'SELECT UserId, Email FROM dbo.Users WHERE UserName = @TargetUser;';
EXEC sys.sp_executesql 
    @stmt = @Sql, 
    @params = N'@TargetUser NVARCHAR(100)', 
    @TargetUser = @Input;`,
    tags: ['security', 'sql-injection', 'dynamic-sql', 'sp_executesql', 'quotename']
  },
  {
    id: 'union-vs-union-all-tip',
    title: 'Default to UNION ALL Unless Deduplication is Explicitly Required',
    category: 'Performance',
    problem: 'Using UNION to merge result sets when sets are already disjoint or duplicate rows are acceptable.',
    why: 'UNION executes an expensive DISTINCT sort operation across all columns to eliminate duplicate rows, consuming CPU, tempdb, and memory grant resources. UNION ALL performs simple stream concatenation without sorting.',
    betterApproach: 'Always default to UNION ALL unless you specifically require row deduplication.',
    badCode: `-- ❌ Wasted sort operation:
SELECT OrderId, CustomerId FROM dbo.CurrentOrders
UNION
SELECT OrderId, CustomerId FROM dbo.ArchivedOrders;`,
    goodCode: `-- ✅ Fast stream concatenation:
SELECT OrderId, CustomerId FROM dbo.CurrentOrders
UNION ALL
SELECT OrderId, CustomerId FROM dbo.ArchivedOrders;`,
    tags: ['union', 'union-all', 'sort', 'performance']
  },
  {
    id: 'temp-tables-vs-table-variables',
    title: 'Temp Tables (#temp) vs Table Variables (@table)',
    category: 'Architecture & Performance',
    problem: 'Using table variables for large datasets (> 100 rows).',
    why: 'In older SQL Server versions (pre-2019 without deferred compilation), the query optimizer always estimates table variables at 1 row, causing horrific nested loop joins and memory spills. Additionally, table variables do not support statistics or parallel queries.',
    betterApproach: 'Use Table Variables only for tiny lookup lists (< 100 rows). For anything larger, use Temporary Tables (#table) which support distribution statistics, nonclustered indexes, and parallelism.',
    badCode: `-- ❌ Table variable with 50,000 rows causes bad cardinality estimates:
DECLARE @TempData TABLE (OrderId INT PRIMARY KEY);
INSERT INTO @TempData SELECT OrderId FROM dbo.Orders WHERE Status = 'Active';`,
    goodCode: `-- ✅ #temp tables build accurate column statistics and parallel plans:
CREATE TABLE #TempData (
    OrderId INT NOT NULL PRIMARY KEY CLUSTERED
);
INSERT INTO #TempData (OrderId) 
SELECT OrderId FROM dbo.Orders WHERE Status = 'Active';`,
    tags: ['temp-tables', 'table-variables', 'statistics', 'cardinality']
  },
  {
    id: 'avoid-cursors-set-based',
    title: 'Avoid Unnecessary Cursors — Embrace Set-Based Operations',
    category: 'Performance',
    problem: 'Using a CURSOR or WHILE loop to iterate through rows one by one to update values.',
    why: 'Cursors execute row-by-row (RBAR - Row By Agonizing Row), taking individual locks, round-tripping through the engine, and disabling the optimizer from vectorizing or parallelizing operations.',
    betterApproach: 'Use window functions, CTEs, or set-based UPDATE ... FROM statements.',
    badCode: `-- ❌ RBAR: Slow cursor updating rows one by one:
DECLARE order_cursor CURSOR FOR SELECT OrderId, Quantity FROM dbo.Orders;
OPEN order_cursor;
-- FETCH NEXT ... WHILE @@FETCH_STATUS = 0 ... UPDATE ...`,
    goodCode: `-- ✅ Set-based batch update runs orders of magnitude faster:
UPDATE o
SET o.Discount = CASE WHEN o.Quantity > 10 THEN 0.15 ELSE 0.05 END
FROM dbo.Orders o;`,
    tags: ['cursors', 'set-based', 'rbar', 'window-functions']
  }
];
