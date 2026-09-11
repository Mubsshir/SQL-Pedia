import { QuerySnippet } from '../../types';

export const developerUtilsQueries: QuerySnippet[] = [
  {
    id: 'find-tables-with-column',
    title: 'Find Tables Containing Column Name',
    category: 'Developer Utilities',
    subcategory: 'Column Search',
    description: 'Quickly find all tables, views, and schemas that contain a specific column name.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['find-column', 'sys.tables', 'sys.columns', 'schema', 'search'],
    featured: true,
    whenToUse: 'When locating where a foreign key or property (e.g. CustomerId, CreatedDate, StatusId) is stored across the entire database.',
    parameters: [
      {
        name: 'ColumnPattern',
        placeholder: "'%Customer%'",
        description: 'Column name pattern to find',
        defaultValue: "'%Customer%'"
      }
    ],
    sql: `SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name AS TableName,
    c.name AS ColumnName,
    types.name AS DataType,
    c.max_length,
    c.is_nullable,
    c.is_identity
FROM sys.tables t
INNER JOIN sys.columns c
    ON t.object_id = c.object_id
INNER JOIN sys.types types
    ON c.user_type_id = types.user_type_id
WHERE c.name LIKE '%Customer%'
ORDER BY SchemaName, TableName, c.column_id;`,
    columnsReturned: [
      { name: 'SchemaName', description: 'Table schema (dbo, sales, staging, etc.)' },
      { name: 'TableName', description: 'Table containing the matched column' },
      { name: 'ColumnName', description: 'Matched column name' },
      { name: 'DataType', description: 'Data type (INT, VARCHAR, etc.)' }
    ],
    relatedQueryIds: ['find-columns-by-datatype', 'find-object-by-name']
  },
  {
    id: 'find-columns-by-datatype',
    title: 'Find Columns by Data Type (Audit Legacy Types)',
    category: 'Developer Utilities',
    subcategory: 'Column Search',
    description: 'Find all columns of a specific data type across all user tables (e.g. finding deprecated TEXT, NTEXT, or finding VARCHAR(MAX)).',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['data-type', 'audit', 'text', 'ntext', 'varchar-max', 'sys.columns'],
    whenToUse: 'Schema modernization audits, identifying unindexed LOB columns, or standardizing date formats.',
    parameters: [
      {
        name: 'TargetType',
        placeholder: "'text'",
        description: 'Target data type name',
        defaultValue: "'text'"
      }
    ],
    sql: `SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name AS TableName,
    c.name AS ColumnName,
    types.name AS DataType,
    c.max_length,
    c.is_nullable
FROM sys.tables t
INNER JOIN sys.columns c
    ON t.object_id = c.object_id
INNER JOIN sys.types types
    ON c.user_type_id = types.user_type_id
WHERE types.name IN ('text', 'ntext', 'image') -- Or target type e.g. 'datetime'
ORDER BY SchemaName, TableName;`,
    relatedQueryIds: ['find-tables-with-column']
  },
  {
    id: 'approximate-row-counts',
    title: 'Instant Table Row Counts (Zero Locks via Partition Stats)',
    category: 'Developer Utilities',
    subcategory: 'Data Profiling',
    description: 'Retrieve accurate row counts for all tables instantly from sys.dm_db_partition_stats without running slow, blocking SELECT COUNT(*) queries.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['row-count', 'fast', 'dm_db_partition_stats', 'zero-lock', 'table-size'],
    featured: true,
    whenToUse: 'Quickly survey table sizes across an entire database without taking shared locks or scanning multi-gigabyte tables.',
    sql: `SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name AS TableName,
    SUM(p.row_count) AS ApproximateRowCount,
    CAST(ROUND((SUM(p.used_page_count) * 8.0) / 1024, 2) AS DECIMAL(18, 2)) AS UsedSpaceMB,
    CAST(ROUND((SUM(p.reserved_page_count) * 8.0) / 1024, 2) AS DECIMAL(18, 2)) AS ReservedSpaceMB
FROM sys.tables t
INNER JOIN sys.dm_db_partition_stats p
    ON t.object_id = p.object_id
WHERE p.index_id IN (0, 1) -- 0 = Heap, 1 = Clustered Index
GROUP BY t.schema_id, t.name
ORDER BY ApproximateRowCount DESC;`,
    columnsReturned: [
      { name: 'SchemaName', description: 'Table schema' },
      { name: 'TableName', description: 'Table name' },
      { name: 'ApproximateRowCount', description: 'Exact row count maintained by SQL Server metadata' },
      { name: 'UsedSpaceMB', description: 'Storage actually holding data and indexes' },
      { name: 'ReservedSpaceMB', description: 'Total disk space allocated by the storage engine' }
    ],
    notes: [
      'Metadata row counts in sys.dm_db_partition_stats are updated continuously by the storage engine and are 100% accurate under normal conditions.',
      'Executes in milliseconds even on tables with billions of rows!'
    ],
    relatedQueryIds: ['table-size-and-row-count']
  },
  {
    id: 'find-object-by-name',
    title: 'Find Database Object by Name (Any Type)',
    category: 'Developer Utilities',
    subcategory: 'Object Discovery',
    description: 'Search sys.objects for tables, views, stored procedures, functions, triggers, and sequences matching a name fragment.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['find-object', 'sys.objects', 'search', 'discovery', 'type_desc'],
    whenToUse: 'When you remember a word from an object name but not whether it was a table, view, or stored procedure.',
    parameters: [
      {
        name: 'ObjectNameFragment',
        placeholder: "'%Payment%'",
        description: 'Object name fragment to match',
        defaultValue: "'%Payment%'"
      }
    ],
    sql: `SELECT
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    o.name AS ObjectName,
    o.type_desc AS ObjectType,
    o.create_date,
    o.modify_date
FROM sys.objects o
WHERE o.name LIKE '%Payment%'
  AND o.is_ms_shipped = 0 -- Exclude built-in Microsoft system objects
ORDER BY SchemaName, o.type_desc, o.name;`,
    columnsReturned: [
      { name: 'SchemaName', description: 'Object schema' },
      { name: 'ObjectName', description: 'Object name' },
      { name: 'ObjectType', description: 'USER_TABLE, VIEW, SQL_STORED_PROCEDURE, etc.' },
      { name: 'modify_date', description: 'Timestamp of last schema modification' }
    ],
    relatedQueryIds: ['find-tables-with-column', 'find-procedure-by-text']
  },
  {
    id: 'identity-column-consumption',
    title: 'Identity Column Status & Capacity Risk Check',
    category: 'Developer Utilities',
    subcategory: 'Data Profiling',
    description: 'Check current identity values against data type limits (INT max: 2,147,483,647) to alert before production tables exhaust identity ranges.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['identity', 'overflow', 'int', 'bigint', 'sys.identity_columns', 'capacity'],
    whenToUse: 'Prevent catastrophic production outages caused by integer identity overflow on high-velocity tables.',
    sql: `SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name AS TableName,
    c.name AS IdentityColumnName,
    types.name AS DataType,
    c.last_value,
    CASE types.name
        WHEN 'tinyint'  THEN 255
        WHEN 'smallint' THEN 32767
        WHEN 'int'      THEN 2147483647
        WHEN 'bigint'   THEN 9223372036854775807
    END AS MaxCapacity,
    CAST(
        ROUND(
            (CAST(c.last_value AS FLOAT) / 
             CASE types.name
                 WHEN 'tinyint'  THEN 255
                 WHEN 'smallint' THEN 32767
                 WHEN 'int'      THEN 2147483647
                 WHEN 'bigint'   THEN 9223372036854775807
             END) * 100, 2
        ) AS DECIMAL(5, 2)
    ) AS PercentConsumed
FROM sys.identity_columns c
INNER JOIN sys.tables t
    ON c.object_id = t.object_id
INNER JOIN sys.types types
    ON c.user_type_id = types.user_type_id
WHERE c.last_value IS NOT NULL
ORDER BY PercentConsumed DESC;`,
    columnsReturned: [
      { name: 'TableName', description: 'Table with identity column' },
      { name: 'last_value', description: 'Most recently generated identity value' },
      { name: 'PercentConsumed', description: 'Percentage of total available integer capacity used' }
    ],
    notes: [
      'If PercentConsumed exceeds 80% on an INT column, immediately schedule migration to BIGINT before system crashes.'
    ],
    relatedQueryIds: ['approximate-row-counts']
  },
  {
    id: 'find-duplicate-rows-group-by',
    title: 'Find Duplicate Rows with GROUP BY & HAVING',
    category: 'Developer Utilities',
    subcategory: 'Data Profiling',
    description: 'Find duplicate key occurrences and row counts across one or more columns.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['duplicates', 'group-by', 'having', 'data-quality'],
    whenToUse: 'Identifying duplicate records before applying a UNIQUE constraint or Primary Key.',
    parameters: [
      {
        name: 'TableName',
        placeholder: 'dbo.Customer',
        description: 'Table to check',
        defaultValue: 'dbo.Customer'
      },
      {
        name: 'KeyColumn',
        placeholder: 'Email',
        description: 'Column expected to be unique',
        defaultValue: 'Email'
      }
    ],
    sql: `SELECT
    Email,
    COUNT(*) AS DuplicateCount
FROM dbo.Customer
GROUP BY Email
HAVING COUNT(*) > 1
ORDER BY DuplicateCount DESC;`,
    relatedQueryIds: ['deduplicate-cte-rows']
  },
  {
    id: 'find-unindexed-foreign-keys',
    title: 'Find Foreign Keys Missing Indexes (Deadlock & Cascade Hazard)',
    category: 'Developer Utilities',
    subcategory: 'Data Profiling',
    description: 'Find all foreign keys that do not have a corresponding supporting nonclustered index on the referencing columns.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['foreign-keys', 'missing-index', 'deadlock', 'cascade-delete', 'indexes'],
    whenToUse: 'When experiencing frequent deadlocks or slow DELETE statements on parent tables.',
    sql: `SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    fk.name AS ForeignKeyName,
    c.name AS ForeignKeyColumn,
    'CREATE NONCLUSTERED INDEX [IX_' + t.name + '_' + c.name + '] ON ' 
        + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) + ' (' + QUOTENAME(c.name) + ');' AS CreateIndexScript
FROM sys.foreign_key_columns fkc
INNER JOIN sys.foreign_keys fk 
    ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables t 
    ON fkc.parent_object_id = t.object_id
INNER JOIN sys.schemas s 
    ON t.schema_id = s.schema_id
INNER JOIN sys.columns c 
    ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
WHERE NOT EXISTS (
    -- Check if a nonclustered or clustered index starts with the foreign key column
    SELECT 1 
    FROM sys.index_columns ic
    INNER JOIN sys.indexes i 
        ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    WHERE ic.object_id = fkc.parent_object_id
      AND ic.column_id = fkc.parent_column_id
      AND ic.key_ordinal = 1
)
ORDER BY SchemaName, TableName;`,
    notes: [
      'Deleting a parent record forces SQL Server to perform a full table scan on the child table if the child foreign key column is not indexed.',
      'One of the #1 root causes of deadlocks in relational OLTP databases.'
    ],
    relatedQueryIds: ['missing-indexes', 'blocking-sessions']
  },
  {
    id: 'generate-insert-template',
    title: 'Generate INSERT Script Template from Table Schema',
    category: 'Developer Utilities',
    subcategory: 'Script Generation',
    description: 'Generates a ready-to-use INSERT INTO dbo.Table (col1, col2) VALUES (...) script excluding identity columns.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['generate-insert', 'metadata', 'scripting', 'template', 'sys.columns'],
    whenToUse: 'Quickly generating insert statements without manually typing dozens of column names.',
    parameters: [
      {
        name: 'TableName',
        placeholder: "'Employee'",
        description: 'Target table name',
        defaultValue: "'Employee'"
      }
    ],
    sql: `DECLARE @TableName NVARCHAR(128) = 'Employee';

SELECT 
    'INSERT INTO dbo.' + QUOTENAME(t.name) + ' (' + CHAR(13) + CHAR(10)
    + STRING_AGG('    ' + QUOTENAME(c.name), ',' + CHAR(13) + CHAR(10)) 
    + CHAR(13) + CHAR(10) + ')' + CHAR(13) + CHAR(10) + 'VALUES (' + CHAR(13) + CHAR(10)
    + STRING_AGG('    -- @' + c.name + ' (' + ty.name + CASE WHEN ty.name LIKE '%char%' THEN '(' + CAST(c.max_length AS VARCHAR(10)) + ')' ELSE '' END + ')', ',' + CHAR(13) + CHAR(10))
    + CHAR(13) + CHAR(10) + ');' AS GeneratedInsertScript
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.name = @TableName
  AND c.is_identity = 0
  AND c.is_computed = 0
GROUP BY t.name;`,
    relatedQueryIds: ['find-tables-with-column', 'generate-data-insert-script']
  },
  {
    id: 'generate-data-insert-script',
    title: 'Generate Data INSERT Scripts for Master Tables (< 1000 Rows)',
    category: 'Developer Utilities',
    subcategory: 'Script Generation',
    description: 'Dynamically generates ready-to-run INSERT INTO [Table] ([Cols]) VALUES (...) statements containing actual row data for master tables or lookup tables (< 1000 rows). Automatically excludes identity columns, formats datetimes, handles NULLs, and escapes single quotes.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['generate-insert', 'data-scripting', 'master-table', 'dynamic-sql', 'export-data', 'sys.all_columns', 'insert-scripts'],
    featured: true,
    whenToUse: 'When needing to quickly copy or deploy master table configuration data, lookup entries, or environment-specific patches (less than 1,000 rows) without needing full BCP or SSIS exports.',
    parameters: [
      {
        name: 'DatabaseName',
        placeholder: 'meterreplacement',
        description: "Target table's database name",
        defaultValue: 'meterreplacement'
      },
      {
        name: 'TABLE_NAME',
        placeholder: "'m_complaint_sub_actionmaster'",
        description: 'Master table name to export data from',
        defaultValue: "'m_complaint_sub_actionmaster'"
      },
      {
        name: 'FILTER_CONDITION',
        placeholder: "' WHERE [subaction_tblrefid] IN (64)'",
        description: 'Optional WHERE clause filter condition (or empty string)',
        defaultValue: "' WHERE [subaction_tblrefid] IN (64)'"
      }
    ],
    sql: `USE meterreplacement--- table's DB name 
GO

DECLARE @TABLE_NAME VARCHAR(MAX) = 'm_complaint_sub_actionmaster',
        @FILTER_CONDITION VARCHAR(MAX) = ' WHERE [subaction_tblrefid] IN (64)',
        @CSV_COLUMN VARCHAR(MAX),
        @QUOTED_DATA VARCHAR(MAX),
        @TEXT VARCHAR(MAX)

-- 1. Extract non-identity column names as comma-separated list
SELECT @CSV_COLUMN=STUFF
(
    (
     SELECT ',['+ NAME +']' FROM sys.all_columns 
     WHERE OBJECT_ID=OBJECT_ID(@TABLE_NAME) AND 
     is_identity!=1 FOR XML PATH('')
    ),1,1,''
)

-- 2. Build quoted literal value expressions with NULL, datetime & quote escaping
SELECT @QUOTED_DATA=STUFF
(
    (
     SELECT ' ISNULL(CASE WHEN '+C.name+' IS NOT NULL THEN CONCAT('''''''',REPLACE('+CASE WHEN ty.NAME LIKE '%datetime%' THEN CONCAT('FORMAT(',C.name,',''yyyy-MM-dd hh:mm:ss'')')  ELSE C.name END +','''''''',''''''''''''),'''''''') END,'+'''NULL'''+')+'','''+'+'
     FROM sys.all_columns C
     JOIN sys.types ty ON c.user_type_id = ty.user_type_id
     WHERE OBJECT_ID=OBJECT_ID(@TABLE_NAME) AND 
     is_identity!=1 FOR XML PATH('')
    ),1,1,''
)

-- 3. Construct dynamic query that outputs executable INSERT statements
SELECT @TEXT='SELECT ''INSERT INTO '+@TABLE_NAME+'('+@CSV_COLUMN+')VALUES('''+'+'+SUBSTRING(@QUOTED_DATA,1,LEN(@QUOTED_DATA)-5)+'+'+''')'''+' Insert_Scripts FROM '+@TABLE_NAME + @FILTER_CONDITION

-- 4. Print and execute to display generated INSERT statements in SSMS grid
--SELECT @CSV_COLUMN AS CSV_COLUMN,@QUOTED_DATA AS QUOTED_DATA,@TEXT TEXT
PRINT @TEXT
EXECUTE (@TEXT)`,
    notes: [
      'Ideal for copying master, configuration, or lookup table data with fewer than 1,000 rows across development, QA, and production environments.',
      'Automatically handles is_identity != 1 so generated scripts do not attempt to insert into identity columns.',
      'Quotes and escapes embedded single quotes via REPLACE(...) and casts dates to yyyy-MM-dd hh:mm:ss format.',
      'Outputs executable INSERT INTO ... VALUES (...) statements in the SSMS results grid (one row per statement).',
      'For large tables (> 100,000 rows), prefer BCP export/import, SSIS, or bcp in/out instead of generating text scripts.'
    ],
    warnings: [
      'Always test generated INSERT statements in a transaction (BEGIN TRAN ... ROLLBACK TRAN) on target environments to verify constraints and foreign keys.'
    ],
    columnsReturned: [
      { name: 'Insert_Scripts', description: 'Dynamically generated SQL INSERT INTO statement containing literal column data and values.' }
    ],
    relatedQueryIds: ['generate-insert-template', 'find-tables-with-column']
  }
];

