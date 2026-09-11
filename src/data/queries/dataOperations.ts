import { QuerySnippet } from '../../types';

export const dataOperationsQueries: QuerySnippet[] = [
  {
    id: 'safe-update-pattern',
    title: 'Safe UPDATE Pattern (Preview with SELECT First)',
    category: 'Data Operations',
    subcategory: 'Safe Updates & Deletes',
    description: 'Demonstrates the team golden rule: Always write and verify target rows with SELECT before running UPDATE.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['update', 'safe', 'preview', 'best-practices', 'data-modification'],
    featured: true,
    whenToUse: 'Whenever modifying production data manually or writing one-off data cleanup scripts.',
    sql: `-- STEP 1: PREVIEW - Verify exact rows and proposed values before changing anything!
SELECT 
    c.CustomerId,
    c.AccountStatus AS CurrentStatus,
    'Active' AS ProposedStatus,
    c.LastLoginDate
FROM dbo.Customer c
WHERE c.LastLoginDate >= '2026-01-01'
  AND c.AccountStatus = 'Inactive';

-- STEP 2: EXECUTE UPDATE inside a transaction with row count verification
BEGIN TRANSACTION;

UPDATE c
SET 
    c.AccountStatus = 'Active',
    c.ModifiedDate = SYSUTCDATETIME()
FROM dbo.Customer c
WHERE c.LastLoginDate >= '2026-01-01'
  AND c.AccountStatus = 'Inactive';

-- Inspect affected rows
SELECT @@ROWCOUNT AS RowsUpdated;

-- VERIFY BEFORE COMMITTING:
-- If row count matches expectations:
COMMIT TRANSACTION;
-- If row count is unexpected:
-- ROLLBACK TRANSACTION;`,
    notes: [
      'Always test your WHERE clause in a SELECT query first.',
      'Check @@ROWCOUNT immediately after UPDATE before running COMMIT.'
    ],
    warnings: [
      'An UPDATE without a WHERE clause will update every single row in the table.'
    ],
    relatedQueryIds: ['safe-batch-delete', 'deduplicate-cte-rows']
  },
  {
    id: 'safe-batch-delete',
    title: 'Batch DELETE in Chunks (Prevent Lock Escalation & Log Explosion)',
    category: 'Data Operations',
    subcategory: 'Safe Updates & Deletes',
    description: 'Delete millions of obsolete rows in small transactions (e.g. 5,000 rows per batch) with checkpoints to avoid table lock escalation and log space exhaustion.',
    difficulty: 'Intermediate',
    risk: 'destructive',
    sqlServerVersion: '2016+',
    tags: ['delete', 'batching', 'chunks', 'lock-escalation', 'log-bloat', 'top'],
    featured: true,
    whenToUse: 'Purging historical audit logs or old operational records from multi-million row tables.',
    parameters: [
      {
        name: 'BatchSize',
        placeholder: '5000',
        description: 'Number of rows to delete per iteration',
        defaultValue: '5000'
      },
      {
        name: 'CutoffDate',
        placeholder: "'2024-01-01'",
        description: 'Age threshold for data deletion',
        defaultValue: "'2024-01-01'"
      }
    ],
    sql: `DECLARE @BatchSize INT = 5000;
DECLARE @RowsDeleted INT = 1;
DECLARE @TotalDeleted BIGINT = 0;

-- Optional: Set transaction isolation to READ COMMITTED
WHILE @RowsDeleted > 0
BEGIN
    BEGIN TRANSACTION;

    DELETE TOP (@BatchSize)
    FROM dbo.AuditLog
    WHERE LogDate < '2024-01-01';

    SET @RowsDeleted = @@ROWCOUNT;
    SET @TotalDeleted += @RowsDeleted;

    COMMIT TRANSACTION;

    -- Brief pause to allow concurrent application queries and transaction log truncation
    WAITFOR DELAY '00:00:00.100'; -- 100ms pause

    RAISERROR('Deleted %d rows in batch. Cumulative total: %I64d', 0, 1, @RowsDeleted, @TotalDeleted) WITH NOWAIT;
END;

PRINT 'Batch delete completed. Total rows deleted: ' + CAST(@TotalDeleted AS VARCHAR(30));`,
    notes: [
      'A single DELETE of > 5,000 rows can trigger Lock Escalation, converting row locks to an exclusive Table Lock (X) that freezes all concurrent access.',
      'Small transactions allow the transaction log to truncate during log backups instead of expanding uncontrollably.'
    ],
    warnings: [
      'Destructive operation. Always ensure you have a recent backup before executing.'
    ],
    relatedQueryIds: ['safe-update-pattern']
  },
  {
    id: 'deduplicate-cte-rows',
    title: 'Deduplicate Rows with ROW_NUMBER() CTE',
    category: 'Data Operations',
    subcategory: 'Deduplication',
    description: 'Find or delete duplicate records while keeping the most recent or highest-priority row using a Common Table Expression.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['deduplicate', 'cte', 'row_number', 'duplicates', 'partition-by'],
    featured: true,
    whenToUse: 'Clean duplicate customer records, staging tables, or telemetry records caused by duplicate syncs.',
    sql: `;WITH NumberedRows AS (
    SELECT
        CustomerId,
        Email,
        CreatedDate,
        -- Partition by duplicate key columns, order by column that determines which to keep
        ROW_NUMBER() OVER (
            PARTITION BY Email 
            ORDER BY CreatedDate DESC, CustomerId DESC
        ) AS RowNum
    FROM dbo.Customer
)
-- Step 1: Preview duplicates to be deleted (RowNum > 1)
SELECT * 
FROM NumberedRows 
WHERE RowNum > 1;

-- Step 2: Delete duplicate records (uncomment to execute)
-- DELETE FROM NumberedRows 
-- WHERE RowNum > 1;`,
    columnsReturned: [
      { name: 'RowNum', description: '1 = Keeper record (newest); 2+ = Duplicates to remove' }
    ],
    notes: [
      'In SQL Server, you can directly execute DELETE against a CTE! Only rows matching the CTE WHERE filter will be deleted from the underlying table.'
    ],
    relatedQueryIds: ['find-duplicate-rows-group-by', 'running-totals-window-function']
  },
  {
    id: 'running-totals-window-function',
    title: 'Running Totals & Moving Averages (Window Functions)',
    category: 'Data Operations',
    subcategory: 'Window Functions',
    description: 'High-performance running totals and 7-day moving averages using the OVER clause with explicit framing (ROWS BETWEEN).',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['window-functions', 'running-total', 'moving-average', 'rows-between', 'performance'],
    whenToUse: 'Financial reports, cumulative sales calculations, or telemetry metric smoothing.',
    sql: `SELECT
    OrderId,
    CustomerId,
    OrderDate,
    OrderAmount,
    -- Cumulative running total per customer
    SUM(OrderAmount) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate, OrderId
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS RunningTotalPerCustomer,
    -- 7-row moving average
    AVG(OrderAmount) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate, OrderId
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS MovingAvg7Orders
FROM dbo.Orders;`,
    notes: [
      'CRITICAL PERFORMANCE TIP: Always specify "ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW". If omitted, SQL Server defaults to "RANGE BETWEEN ...", which creates a disk-based spool in TempDB and is significantly slower!'
    ],
    relatedQueryIds: ['lag-lead-comparison', 'deduplicate-cte-rows']
  },
  {
    id: 'lag-lead-comparison',
    title: 'Period-over-Period Comparison with LAG & LEAD',
    category: 'Data Operations',
    subcategory: 'Window Functions',
    description: 'Compare current row value against previous or subsequent row values to calculate period-over-period growth or time between events.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['lag', 'lead', 'analytics', 'growth', 'window-functions'],
    whenToUse: 'Calculating day-over-day sales variance, user session duration between clicks, or status transitions.',
    sql: `SELECT
    CustomerId,
    OrderDate,
    OrderAmount AS CurrentOrderAmount,
    -- Get previous order amount
    LAG(OrderAmount, 1, 0) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
    ) AS PreviousOrderAmount,
    -- Calculate variance from previous order
    OrderAmount - LAG(OrderAmount, 1, OrderAmount) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
    ) AS AmountDifference,
    -- Look ahead to next order date
    LEAD(OrderDate) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
    ) AS NextOrderDate
FROM dbo.Orders;`,
    relatedQueryIds: ['running-totals-window-function']
  },
  {
    id: 'string-split-and-aggregate',
    title: 'STRING_SPLIT & STRING_AGG (Array & List Operations)',
    category: 'Data Operations',
    subcategory: 'String & JSON Operations',
    description: 'Split comma-delimited strings into tabular rows (with 1-based ordinal in 2022+), and concatenate grouped rows back into delimited lists.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2019+',
    tags: ['string_split', 'string_agg', 'comma-delimited', 'array', 'concatenation'],
    whenToUse: 'Parsing delimited parameter inputs or aggregating child tags/labels into a single display string.',
    sql: `-- 1. STRING_AGG: Group rows into comma-separated list
SELECT
    d.DepartmentName,
    STRING_AGG(e.FirstName + ' ' + e.LastName, ', ') WITHIN GROUP (ORDER BY e.LastName) AS TeamMembers
FROM dbo.Department d
INNER JOIN dbo.Employee e ON d.DepartmentId = e.DepartmentId
GROUP BY d.DepartmentName;

-- 2. STRING_SPLIT: Unpack delimited string into relational rows
DECLARE @TagList NVARCHAR(500) = 'SQLServer,Performance,Partitioning,Index';

SELECT 
    value AS TagName
    -- , ordinal AS Position -- Available in SQL Server 2022+ with STRING_SPLIT(@TagList, ',', 1)
FROM STRING_SPLIT(@TagList, ',');`,
    relatedQueryIds: ['json-operations-t-sql']
  },
  {
    id: 'json-operations-t-sql',
    title: 'Parse & Query JSON with OPENJSON & JSON_VALUE',
    category: 'Data Operations',
    subcategory: 'String & JSON Operations',
    description: 'Extract scalar properties with JSON_VALUE and shred JSON arrays into strongly typed relational rows using OPENJSON WITH.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['json', 'openjson', 'json_value', 'json_query', 'nosql', 'payload'],
    whenToUse: 'Processing incoming webhook payloads, event logs, or JSON columns stored in SQL Server.',
    sql: `DECLARE @JsonPayload NVARCHAR(MAX) = N'{
    "orderId": 10425,
    "customer": {
        "name": "Jane Doe",
        "email": "jane@example.com"
    },
    "items": [
        { "sku": "A100", "qty": 2, "price": 49.99 },
        { "sku": "B200", "qty": 1, "price": 120.00 }
    ]
}';

-- 1. Extract scalar values using JSON_VALUE
SELECT
    JSON_VALUE(@JsonPayload, '$.orderId') AS OrderId,
    JSON_VALUE(@JsonPayload, '$.customer.name') AS CustomerName,
    JSON_VALUE(@JsonPayload, '$.customer.email') AS CustomerEmail;

-- 2. Shred JSON array into relational rows using OPENJSON
SELECT
    JSON_VALUE(@JsonPayload, '$.orderId') AS OrderId,
    item.sku,
    item.qty,
    item.price
FROM OPENJSON(@JsonPayload, '$.items')
WITH (
    sku VARCHAR(20) '$.sku',
    qty INT '$.qty',
    price DECIMAL(10, 2) '$.price'
) AS item;`,
    relatedQueryIds: ['string-split-and-aggregate']
  },
  {
    id: 'pivot-monthly-summary',
    title: 'PIVOT Rows into Columns (Monthly Summary)',
    category: 'Data Operations',
    subcategory: 'Window Functions',
    description: 'Rotate rows into columns to build matrix reports (e.g. sales aggregated by month across products).',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['pivot', 'cross-tab', 'matrix', 'reporting', 'aggregation'],
    whenToUse: 'Transforming normalized transactional rows into cross-tabulated management summary reports.',
    sql: `SELECT 
    ProductName,
    ISNULL([Jan], 0) AS JanSales,
    ISNULL([Feb], 0) AS FebSales,
    ISNULL([Mar], 0) AS MarSales,
    ISNULL([Apr], 0) AS AprSales
FROM
(
    SELECT 
        p.ProductName,
        FORMAT(o.OrderDate, 'MMM') AS OrderMonth,
        od.LineTotal
    FROM dbo.Orders o
    INNER JOIN dbo.OrderLineItem od ON o.OrderId = od.OrderId
    INNER JOIN dbo.Product p ON od.ProductId = p.ProductId
    WHERE o.OrderDate >= '2026-01-01' AND o.OrderDate < '2026-05-01'
) AS SourceTable
PIVOT
(
    SUM(LineTotal)
    FOR OrderMonth IN ([Jan], [Feb], [Mar], [Apr])
) AS PivotTable
ORDER BY ProductName;`,
    relatedQueryIds: ['unpivot-normalized', 'running-totals-window-function']
  },
  {
    id: 'unpivot-normalized',
    title: 'UNPIVOT Columns into Normalized Rows',
    category: 'Data Operations',
    subcategory: 'Window Functions',
    description: 'Transform spreadsheet-style wide columns (e.g. Q1Sales, Q2Sales, Q3Sales) back into normalized relational rows.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['unpivot', 'normalization', 'columns-to-rows', 'etl'],
    whenToUse: 'Importing wide spreadsheets or denormalized data into clean relational structures.',
    sql: `SELECT 
    ProductId,
    QuarterName,
    Revenue
FROM dbo.QuarterlyRevenue
UNPIVOT
(
    Revenue FOR QuarterName IN (Q1Sales, Q2Sales, Q3Sales, Q4Sales)
) AS UnpivotTable;`,
    relatedQueryIds: ['pivot-monthly-summary']
  },
  {
    id: 'recursive-cte-hierarchy',
    title: 'Recursive CTE (Manager-Employee Org Chart)',
    category: 'Data Operations',
    subcategory: 'Deduplication',
    description: 'Traverse self-referencing parent-child hierarchies to calculate employee organizational levels and reporting chains.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['recursive-cte', 'cte', 'hierarchy', 'org-chart', 'parent-child'],
    whenToUse: 'Querying bill of materials (BOM), organization hierarchies, or multi-level category taxonomies.',
    sql: `;WITH OrgHierarchy AS (
    -- Anchor: Top-level managers (no manager above them)
    SELECT
        EmployeeId,
        ManagerId,
        FirstName + ' ' + LastName AS EmployeeName,
        1 AS HierarchyLevel,
        CAST(FirstName + ' ' + LastName AS VARCHAR(1000)) AS ManagementPath
    FROM dbo.Employee
    WHERE ManagerId IS NULL

    UNION ALL

    -- Recursive member: Subordinates
    SELECT
        e.EmployeeId,
        e.ManagerId,
        e.FirstName + ' ' + e.LastName AS EmployeeName,
        oh.HierarchyLevel + 1 AS HierarchyLevel,
        CAST(oh.ManagementPath + ' -> ' + e.FirstName + ' ' + e.LastName AS VARCHAR(1000)) AS ManagementPath
    FROM dbo.Employee e
    INNER JOIN OrgHierarchy oh
        ON e.ManagerId = oh.EmployeeId
)
SELECT
    HierarchyLevel,
    SPACE((HierarchyLevel - 1) * 4) + EmployeeName AS IndentedName,
    ManagementPath
FROM OrgHierarchy
ORDER BY ManagementPath
OPTION (MAXRECURSION 100);`,
    notes: [
      'Always set OPTION (MAXRECURSION N) to prevent infinite loops in cyclic graph structures.'
    ],
    relatedQueryIds: ['running-totals-window-function']
  },
  {
    id: 'merge-statement-upsert',
    title: 'MERGE UPSERT Pattern with OUTPUT $action',
    category: 'Data Operations',
    subcategory: 'Safe Updates & Deletes',
    description: 'Perform atomic INSERT or UPDATE operations based on matching keys with auditing using OUTPUT $action.',
    difficulty: 'Advanced',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['merge', 'upsert', 'output-$action', 'etl', 'sync'],
    whenToUse: 'Synchronizing dimensional or master records from staging tables into target production tables.',
    sql: `MERGE INTO dbo.Customer AS target
USING dbo.CustomerStaging AS source
    ON target.CustomerCode = source.CustomerCode
WHEN MATCHED AND (target.Email <> source.Email OR target.AccountStatus <> source.AccountStatus)
    THEN UPDATE SET
        target.Email = source.Email,
        target.AccountStatus = source.AccountStatus,
        target.ModifiedDate = SYSUTCDATETIME()
WHEN NOT MATCHED BY TARGET
    THEN INSERT (CustomerCode, FirstName, LastName, Email, AccountStatus, CreatedDate)
    VALUES (source.CustomerCode, source.FirstName, source.LastName, source.Email, source.AccountStatus, SYSUTCDATETIME())
OUTPUT
    $action AS ActionTaken,
    inserted.CustomerId,
    inserted.CustomerCode,
    deleted.Email AS OldEmail,
    inserted.Email AS NewEmail;`,
    notes: [
      'MERGE statements must always be terminated with a semicolon (;).',
      'For high concurrency environments with multiple concurrent threads, prefer explicit IF EXISTS / UPDATE / INSERT with HOLDLOCK to avoid known MERGE race conditions.'
    ],
    relatedQueryIds: ['safe-update-pattern']
  }
];

