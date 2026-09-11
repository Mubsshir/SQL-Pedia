import { QuerySnippet } from '../../types';

export const performanceQueries: QuerySnippet[] = [
  {
    id: 'active-queries',
    title: 'Find Active Running Queries',
    category: 'Performance',
    subcategory: 'Active Queries',
    description: 'Find currently executing requests, their duration, CPU usage, database, login, wait info, blocking session, and SQL text.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['active', 'requests', 'sessions', 'dmv', 'cpu', 'duration', 'blocking', 'sql_text'],
    featured: true,
    whenToUse: 'Use immediately when database server CPU spikes or users report system unresponsiveness to see exactly what queries are running right now.',
    sql: `SELECT
    r.session_id,
    r.status,
    r.command,
    r.cpu_time,
    r.total_elapsed_time,
    r.logical_reads,
    r.reads,
    r.writes,
    DB_NAME(r.database_id) AS database_name,
    s.login_name,
    s.host_name,
    s.program_name,
    r.wait_type,
    r.wait_time,
    r.blocking_session_id,
    t.text AS sql_text
FROM sys.dm_exec_requests r
INNER JOIN sys.dm_exec_sessions s
    ON r.session_id = s.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.session_id <> @@SPID
ORDER BY r.total_elapsed_time DESC;`,
    columnsReturned: [
      { name: 'session_id', description: 'SPID of the executing session' },
      { name: 'status', description: 'Request status: running, suspended, runnable, pending' },
      { name: 'command', description: 'Command type: SELECT, INSERT, UPDATE, BACKUP, etc.' },
      { name: 'cpu_time', description: 'Total CPU time consumed in milliseconds' },
      { name: 'total_elapsed_time', description: 'Total execution time in milliseconds' },
      { name: 'logical_reads', description: 'Number of 8KB page reads from memory/buffer pool' },
      { name: 'database_name', description: 'Database context of the request' },
      { name: 'blocking_session_id', description: 'SPID causing a lock wait if blocked (> 0)' },
      { name: 'sql_text', description: 'Full text of the batch containing the request' }
    ],
    notes: [
      'Filtered by session_id <> @@SPID to exclude the monitoring query itself.',
      'A status of "suspended" means the query is waiting for a resource (see wait_type).',
      'total_elapsed_time is in milliseconds (divide by 1000 for seconds, 60000 for minutes).'
    ],
    relatedQueryIds: ['blocking-sessions', 'blocking-tree', 'cpu-intensive-queries', 'long-running-queries']
  },
  {
    id: 'index-fragmentation',
    title: 'Index Fragmentation & Maintenance Generator',
    category: 'Performance',
    subcategory: 'Index Health',
    description: 'Check index fragmentation percentage and generate automated ALTER INDEX REORGANIZE or REBUILD commands based on team thresholds.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['index', 'fragmentation', 'rebuild', 'reorganize', 'maintenance', 'dm_db_index_physical_stats'],
    featured: true,
    whenToUse: 'Run weekly or during maintenance windows to identify fragmented indexes causing high I/O and degraded scan performance.',
    parameters: [
      {
        name: 'IndexName',
        placeholder: "'PK_T_IPData_CateD1'",
        description: 'Target index name to inspect (or omit filter to scan database)',
        defaultValue: "'PK_T_IPData_CateD1'"
      }
    ],
    sql: `SELECT
    OBJECT_NAME(ind.OBJECT_ID) AS TableName,
    ind.name AS IndexName,
    indexstats.index_type_desc AS IndexType,
    indexstats.avg_fragmentation_in_percent,
    'ALTER INDEX ' + QUOTENAME(ind.name)
        + ' ON ' + QUOTENAME(OBJECT_NAME(ind.object_id))
        + CASE
            WHEN indexstats.avg_fragmentation_in_percent > 30
                THEN ' REBUILD;'
            WHEN indexstats.avg_fragmentation_in_percent >= 5
                THEN ' REORGANIZE;'
            ELSE NULL
          END AS SQLQuery
FROM sys.dm_db_index_physical_stats(
    DB_ID(),
    NULL,
    NULL,
    NULL,
    NULL
) indexstats
INNER JOIN sys.indexes ind
    ON ind.object_id = indexstats.object_id
    AND ind.index_id = indexstats.index_id
WHERE ind.name = 'PK_T_IPData_CateD1'
ORDER BY indexstats.avg_fragmentation_in_percent DESC;`,
    columnsReturned: [
      { name: 'TableName', description: 'Name of the table containing the index' },
      { name: 'IndexName', description: 'Name of the clustered or nonclustered index' },
      { name: 'IndexType', description: 'CLUSTERED INDEX, NONCLUSTERED INDEX, etc.' },
      { name: 'avg_fragmentation_in_percent', description: 'Logical fragmentation percentage' },
      { name: 'SQLQuery', description: 'Generated ALTER INDEX command according to threshold logic' }
    ],
    notes: [
      '< 5% → Generally no maintenance required.',
      '5% to 30% → REORGANIZE (online operation, compacts leaf pages without taking heavy table locks).',
      '> 30% → REBUILD (drops and recreates index structure; requires Enterprise edition for ONLINE = ON, otherwise takes schema locks).',
      'Fragmentation thresholds are guidelines: consider total page count (indexes with < 1000 pages can be ignored) and SSD storage characteristics.'
    ],
    warnings: [
      'REBUILD on Standard Edition will hold locks on the table unless executed during low-traffic maintenance windows.',
      'Always consider transaction log growth when rebuilding massive indexes.'
    ],
    relatedQueryIds: ['missing-indexes', 'unused-indexes', 'table-size-and-row-count']
  },
  {
    id: 'blocking-sessions',
    title: 'Find Blocking Sessions & Blocked Queries',
    category: 'Performance',
    subcategory: 'Blocking & Deadlocks',
    description: 'Pinpoint lead blocking sessions holding exclusive locks and all blocked child sessions waiting for resources.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['blocking', 'locks', 'spid', 'wait_resource', 'concurrency', 'lead-blocker'],
    featured: true,
    whenToUse: 'Use when queries appear hung, applications report lock timeouts, or users complain of cascading delays.',
    sql: `SELECT
    blocking.session_id AS blocking_session_id,
    blocked.session_id AS blocked_session_id,
    wait.wait_type,
    wait.wait_duration_ms,
    wait.resource_description,
    s_blocker.login_name AS blocker_login,
    s_blocker.host_name AS blocker_host,
    s_blocker.program_name AS blocker_program,
    t_blocker.text AS blocker_sql_text,
    t_blocked.text AS blocked_sql_text
FROM sys.dm_os_waiting_tasks wait
INNER JOIN sys.dm_exec_requests blocked
    ON wait.session_id = blocked.session_id
INNER JOIN sys.dm_exec_sessions s_blocked
    ON blocked.session_id = s_blocked.session_id
CROSS APPLY sys.dm_exec_sql_text(blocked.sql_handle) t_blocked
LEFT JOIN sys.dm_exec_requests blocking
    ON wait.blocking_session_id = blocking.session_id
LEFT JOIN sys.dm_exec_sessions s_blocker
    ON wait.blocking_session_id = s_blocker.session_id
OUTER APPLY sys.dm_exec_sql_text(blocking.sql_handle) t_blocker
WHERE wait.blocking_session_id IS NOT NULL
  AND wait.blocking_session_id <> 0;`,
    columnsReturned: [
      { name: 'blocking_session_id', description: 'SPID causing the blockage (the root blocker)' },
      { name: 'blocked_session_id', description: 'SPID that is stuck waiting' },
      { name: 'wait_type', description: 'Lock wait type (LCK_M_X, LCK_M_U, LCK_M_S, etc.)' },
      { name: 'wait_duration_ms', description: 'How long the blocked session has waited (ms)' },
      { name: 'blocker_sql_text', description: 'SQL text executed by the blocker (if currently running)' },
      { name: 'blocked_sql_text', description: 'SQL text stuck waiting to execute' }
    ],
    notes: [
      'If blocker_sql_text is NULL, the blocking session has an open uncommitted transaction but is currently idle (e.g. client app opened BEGIN TRAN and did not commit).'
    ],
    relatedQueryIds: ['active-queries', 'blocking-tree', 'kill-spid-safely']
  },
  {
    id: 'blocking-tree',
    title: 'Hierarchical Blocking Tree (Root Blocker)',
    category: 'Performance',
    subcategory: 'Blocking & Deadlocks',
    description: 'A recursive CTE query that resolves multi-level blocking hierarchies and shows the root blocker at the top level (Level 1).',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['blocking', 'hierarchy', 'tree', 'root-blocker', 'cte', 'recursive'],
    whenToUse: 'When dozens of sessions are blocked and you need to immediately identify the single parent session that initiated the chain.',
    sql: `;WITH BlockingChain AS (
    -- Anchor: Root blockers (sessions that are blocking others but not blocked themselves)
    SELECT
        r.session_id,
        r.blocking_session_id,
        1 AS BlockLevel,
        CAST(r.session_id AS VARCHAR(1000)) AS BlockChain
    FROM sys.dm_exec_requests r
    WHERE r.blocking_session_id = 0
      AND r.session_id IN (SELECT DISTINCT blocking_session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0)

    UNION ALL

    -- Recursive: Blocked child sessions
    SELECT
        r.session_id,
        r.blocking_session_id,
        bc.BlockLevel + 1 AS BlockLevel,
        CAST(bc.BlockChain + ' -> ' + CAST(r.session_id AS VARCHAR(10)) AS VARCHAR(1000)) AS BlockChain
    FROM sys.dm_exec_requests r
    INNER JOIN BlockingChain bc
        ON r.blocking_session_id = bc.session_id
)
SELECT
    bc.BlockLevel,
    bc.BlockChain,
    s.login_name,
    s.host_name,
    s.program_name,
    r.status,
    r.wait_type,
    r.wait_time,
    DB_NAME(r.database_id) AS database_name,
    SUBSTRING(t.text, (r.statement_start_offset/2) + 1,
        ((CASE r.statement_end_offset
            WHEN -1 THEN DATALENGTH(t.text)
            ELSE r.statement_end_offset
          END - r.statement_start_offset)/2) + 1) AS current_statement
FROM BlockingChain bc
LEFT JOIN sys.dm_exec_requests r
    ON bc.session_id = r.session_id
INNER JOIN sys.dm_exec_sessions s
    ON bc.session_id = s.session_id
OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
ORDER BY bc.BlockChain;`,
    columnsReturned: [
      { name: 'BlockLevel', description: '1 = Root blocker; 2+ = blocked descendant' },
      { name: 'BlockChain', description: 'Visual path: e.g. 54 -> 62 -> 78' },
      { name: 'current_statement', description: 'Precise individual SQL statement currently executing' }
    ],
    notes: [
      'Level 1 is always the session holding the lock. Address or terminate the level 1 session to unblock all descendants.'
    ],
    relatedQueryIds: ['blocking-sessions', 'active-queries']
  },
  {
    id: 'cpu-intensive-queries',
    title: 'Top CPU-Intensive Queries (Cached Plans)',
    category: 'Performance',
    subcategory: 'Resource Usage',
    description: 'Retrieve top 20 queries consuming the most total worker (CPU) time from the plan cache with execution counts and average times.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['cpu', 'worker_time', 'plan-cache', 'performance-tuning', 'dm_exec_query_stats'],
    whenToUse: 'When analyzing historical or ongoing high CPU consumption on the SQL Server instance.',
    sql: `SELECT TOP 20
    qs.total_worker_time / 1000 AS total_cpu_ms,
    qs.execution_count,
    (qs.total_worker_time / qs.execution_count) / 1000 AS avg_cpu_ms,
    qs.total_elapsed_time / 1000 AS total_elapsed_ms,
    (qs.total_elapsed_time / qs.execution_count) / 1000 AS avg_elapsed_ms,
    qs.total_logical_reads,
    qs.total_logical_reads / qs.execution_count AS avg_logical_reads,
    DB_NAME(CAST(pa.value AS INT)) AS database_name,
    SUBSTRING(t.text, (qs.statement_start_offset/2) + 1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(t.text)
            ELSE qs.statement_end_offset
          END - qs.statement_start_offset)/2) + 1) AS statement_text,
    qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) t
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
CROSS APPLY sys.dm_exec_plan_attributes(qs.plan_handle) pa
WHERE pa.attribute = 'dbid'
ORDER BY qs.total_worker_time DESC;`,
    columnsReturned: [
      { name: 'total_cpu_ms', description: 'Total CPU time spent on all executions of this statement' },
      { name: 'execution_count', description: 'Total number of times this statement was executed since compile' },
      { name: 'avg_cpu_ms', description: 'Average CPU time per execution in milliseconds' },
      { name: 'statement_text', description: 'The exact SQL statement within the stored procedure or batch' },
      { name: 'query_plan', description: 'XML execution plan (can be saved as .sqlplan and opened in SSMS)' }
    ],
    notes: [
      'High execution count with small avg_cpu_ms points to N+1 query problems in application code.',
      'Low execution count with massive avg_cpu_ms points to missing indexes, table scans, or bad hash joins.'
    ],
    relatedQueryIds: ['high-logical-reads', 'missing-indexes']
  },
  {
    id: 'high-logical-reads',
    title: 'Top Queries by Logical Reads (I/O Pressure)',
    category: 'Performance',
    subcategory: 'Resource Usage',
    description: 'Find queries doing the highest number of logical page reads (8KB pages) in the buffer pool, indicating excessive table scans.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['io', 'reads', 'logical_reads', 'buffer_pool', 'scans', 'dm_exec_query_stats'],
    whenToUse: 'When disk latency is elevated or buffer cache hit ratio drops, indicating queries are thrashing memory with full scans.',
    sql: `SELECT TOP 20
    qs.total_logical_reads,
    qs.execution_count,
    qs.total_logical_reads / qs.execution_count AS avg_logical_reads,
    qs.total_logical_writes,
    qs.total_worker_time / 1000 AS total_cpu_ms,
    qs.total_elapsed_time / 1000 AS total_elapsed_ms,
    DB_NAME(CAST(pa.value AS INT)) AS database_name,
    SUBSTRING(t.text, (qs.statement_start_offset/2) + 1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(t.text)
            ELSE qs.statement_end_offset
          END - qs.statement_start_offset)/2) + 1) AS statement_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) t
CROSS APPLY sys.dm_exec_plan_attributes(qs.plan_handle) pa
WHERE pa.attribute = 'dbid'
ORDER BY qs.total_logical_reads DESC;`,
    columnsReturned: [
      { name: 'total_logical_reads', description: 'Sum of all 8KB pages accessed' },
      { name: 'avg_logical_reads', description: 'Average pages read per execution' },
      { name: 'statement_text', description: 'Specific statement driving I/O consumption' }
    ],
    notes: [
      '1 logical read = 8 KB of data. 100,000 reads = 800 MB scanned from memory or disk.'
    ],
    relatedQueryIds: ['cpu-intensive-queries', 'missing-indexes']
  },
  {
    id: 'missing-indexes',
    title: 'Missing Indexes Recommended by Query Optimizer',
    category: 'Performance',
    subcategory: 'Index Health',
    description: 'Inspect the query optimizer missing index dynamic management views to generate CREATE INDEX statements with estimated cost reduction.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['missing-indexes', 'optimizer', 'create-index', 'tuning', 'dm_db_missing_index_details'],
    whenToUse: 'When optimizing queries or investigating slow workloads where optimizer indicates high missing index impact.',
    sql: `SELECT
    CONVERT(DECIMAL(18,2), user_seeks * avg_total_user_cost * (avg_user_impact * 0.01)) AS overall_impact,
    mid.statement AS table_name,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns,
    migs.user_seeks,
    migs.avg_user_impact AS estimated_cost_reduction_percent,
    'CREATE NONCLUSTERED INDEX [IX_' 
        + REPLACE(REPLACE(REPLACE(REPLACE(ISNULL(mid.equality_columns,'') + '_' + ISNULL(mid.inequality_columns,''), '[', ''), ']', ''), ' ', ''), ',', '_')
        + '] ON ' + mid.statement + ' (' + ISNULL(mid.equality_columns, '')
        + CASE WHEN mid.equality_columns IS NOT NULL AND mid.inequality_columns IS NOT NULL THEN ', ' ELSE '' END
        + ISNULL(mid.inequality_columns, '') + ')'
        + ISNULL(' INCLUDE (' + mid.included_columns + ')', '') AS create_index_statement
FROM sys.dm_db_missing_index_group_stats migs
INNER JOIN sys.dm_db_missing_index_groups mig
    ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details mid
    ON mig.index_handle = mid.index_handle
WHERE mid.database_id = DB_ID()
ORDER BY overall_impact DESC;`,
    columnsReturned: [
      { name: 'overall_impact', description: 'Composite score: seeks * cost * impact percentage' },
      { name: 'table_name', description: 'Schema and table requiring the index' },
      { name: 'equality_columns', description: 'Columns evaluated with equality operators (=)' },
      { name: 'inequality_columns', description: 'Columns evaluated with inequalities (<, >, BETWEEN)' },
      { name: 'included_columns', description: 'Columns to include in leaf level (INCLUDE clause)' },
      { name: 'create_index_statement', description: 'Generated T-SQL statement ready for review' }
    ],
    notes: [
      'Do NOT blindly apply every missing index suggestion. Look for existing indexes on the table that can be consolidated with an extra INCLUDE column.',
      'Equality columns should always appear before inequality columns in composite index keys.'
    ],
    relatedQueryIds: ['index-fragmentation', 'unused-indexes']
  },
  {
    id: 'wait-statistics-summary',
    title: 'Instance Wait Statistics (Top Wait Types)',
    category: 'Performance',
    subcategory: 'Wait Statistics',
    description: 'Check cumulative wait statistics on the SQL Server instance while filtering out benign background thread waits.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['waits', 'dm_os_wait_stats', 'cxpacket', 'pageiolatch', 'sos_scheduler_yield', 'lck'],
    whenToUse: 'Use to identify the primary server bottleneck (e.g. disk I/O, parallelism, memory, or locking).',
    sql: `;WITH [Waits] AS (
    SELECT
        wait_type,
        wait_time_ms / 1000.0 AS WaitS,
        (wait_time_ms - signal_wait_time_ms) / 1000.0 AS ResourceS,
        signal_wait_time_ms / 1000.0 AS SignalS,
        waiting_tasks_count AS WaitCount,
        100.0 * wait_time_ms / SUM(wait_time_ms) OVER() AS Percentage,
        ROW_NUMBER() OVER(ORDER BY wait_time_ms DESC) AS RowNum
    FROM sys.dm_os_wait_stats
    WHERE wait_type NOT IN (
        -- Filter benign/idle system background waits
        'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
        'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
        'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
        'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT',
        'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE', 'FT_IFTS_SCHEDULER_IDLE_WAIT',
        'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN', 'SQLTRACE_INCREMENTAL_FLUSH_SLEEP',
        'DIRTY_PAGE_POLL', 'HADR_FILESTREAM_IOMGR_IOCOMPLETION', 'SP_SERVER_DIAGNOSTICS_SLEEP'
    )
)
SELECT
    W1.wait_type,
    CAST(W1.WaitS AS DECIMAL(14, 2)) AS Wait_S,
    CAST(W1.ResourceS AS DECIMAL(14, 2)) AS Resource_S,
    CAST(W1.SignalS AS DECIMAL(14, 2)) AS Signal_S,
    W1.WaitCount,
    CAST(W1.Percentage AS DECIMAL(5, 2)) AS Percentage
FROM [Waits] W1
WHERE W1.RowNum <= 15
ORDER BY W1.WaitS DESC;`,
    columnsReturned: [
      { name: 'wait_type', description: 'Bottleneck indicator (PAGEIOLATCH_SH, CXPACKET, LCK_M_X, etc.)' },
      { name: 'Wait_S', description: 'Total wait time in seconds' },
      { name: 'Resource_S', description: 'Time spent waiting for the physical resource (e.g. disk, memory)' },
      { name: 'Signal_S', description: 'Time spent waiting for CPU scheduler after resource became available' },
      { name: 'Percentage', description: 'Share of total active waits on the instance' }
    ],
    notes: [
      'PAGEIOLATCH_SH / PAGEIOLATCH_EX → Disk subsystem bottleneck or massive scans.',
      'CXPACKET + CXCONSUMER → High degree of parallelism.',
      'SOS_SCHEDULER_YIELD → CPU pressure / CPU scheduler thrashing.',
      'LCK_M_* → Concurrency and locking waits.'
    ],
    relatedQueryIds: ['active-queries', 'blocking-sessions']
  },
  {
    id: 'tempdb-space-usage',
    title: 'TempDB Space Usage by Session',
    category: 'Performance',
    subcategory: 'Resource Usage',
    description: 'Determine which active sessions and queries are filling TempDB with internal objects, worktables, or user temporary tables.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['tempdb', 'spill', 'worktable', 'hash-warning', 'space-usage', 'dm_db_session_space_usage'],
    whenToUse: 'When TempDB is filling up or queries fail with "Could not allocate space for object in TempDB".',
    sql: `SELECT
    s.session_id,
    s.login_name,
    s.host_name,
    s.program_name,
    (tsu.user_objects_alloc_page_count - tsu.user_objects_dealloc_page_count) * 8 / 1024.0 AS user_obj_mb,
    (tsu.internal_objects_alloc_page_count - tsu.internal_objects_dealloc_page_count) * 8 / 1024.0 AS internal_obj_mb,
    ((tsu.user_objects_alloc_page_count - tsu.user_objects_dealloc_page_count) +
     (tsu.internal_objects_alloc_page_count - tsu.internal_objects_dealloc_page_count)) * 8 / 1024.0 AS total_tempdb_mb,
    t.text AS sql_text
FROM sys.dm_db_task_space_usage tsu
INNER JOIN sys.dm_exec_requests r
    ON tsu.session_id = r.session_id
    AND tsu.request_id = r.request_id
INNER JOIN sys.dm_exec_sessions s
    ON r.session_id = s.session_id
OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE ((tsu.user_objects_alloc_page_count - tsu.user_objects_dealloc_page_count) +
       (tsu.internal_objects_alloc_page_count - tsu.internal_objects_dealloc_page_count)) > 0
ORDER BY total_tempdb_mb DESC;`,
    columnsReturned: [
      { name: 'session_id', description: 'SPID holding space in TempDB' },
      { name: 'user_obj_mb', description: 'Megabytes allocated for #temp tables and table variables' },
      { name: 'internal_obj_mb', description: 'Megabytes allocated for sort spills, hash joins, worktables' },
      { name: 'total_tempdb_mb', description: 'Net total TempDB space occupied' }
    ],
    notes: [
      'High internal_obj_mb indicates memory grant shortages forcing sort or hash operations to spill to disk.'
    ],
    relatedQueryIds: ['active-queries', 'high-logical-reads']
  },
  {
    id: 'unused-indexes',
    title: 'Find Unused Indexes (High Write Cost, Zero Reads)',
    category: 'Performance',
    subcategory: 'Index Health',
    description: 'Identify nonclustered indexes that consume write I/O on INSERT/UPDATE/DELETE but have never been used for seeks or lookups since server restart.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['unused-indexes', 'drop-index', 'maintenance', 'sys.dm_db_index_usage_stats'],
    whenToUse: 'Routine index auditing to drop dead weight indexes that degrade write throughput.',
    sql: `SELECT
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    o.name AS TableName,
    i.name AS IndexName,
    ius.user_updates AS TotalWrites,
    ius.user_seeks + ius.user_scans + ius.user_lookups AS TotalReads,
    ius.user_seeks,
    ius.user_scans,
    ius.user_lookups,
    p.rows AS ApproxRowCount,
    'DROP INDEX ' + QUOTENAME(i.name) + ' ON ' + QUOTENAME(SCHEMA_NAME(o.schema_id)) + '.' + QUOTENAME(o.name) + ';' AS DropStatement
FROM sys.dm_db_index_usage_stats ius
INNER JOIN sys.indexes i
    ON ius.object_id = i.object_id AND ius.index_id = i.index_id
INNER JOIN sys.objects o
    ON i.object_id = o.object_id
INNER JOIN sys.partitions p
    ON o.object_id = p.object_id AND i.index_id = p.index_id
WHERE ius.database_id = DB_ID()
  AND o.type = 'U'
  AND i.is_unique = 0
  AND i.is_primary_key = 0
  AND i.type_desc = 'NONCLUSTERED'
  AND (ius.user_seeks + ius.user_scans + ius.user_lookups) = 0
  AND ius.user_updates > 500
ORDER BY ius.user_updates DESC;`,
    columnsReturned: [
      { name: 'TableName', description: 'Table containing the unused index' },
      { name: 'IndexName', description: 'Name of the candidate index to drop' },
      { name: 'TotalWrites', description: 'Count of INSERT/UPDATE/DELETE operations that had to update this index' },
      { name: 'TotalReads', description: 'Sum of user seeks, scans, and lookups (0 = completely unused)' }
    ],
    notes: [
      'sys.dm_db_index_usage_stats resets when SQL Server service restarts. Ensure server has been up for representative workloads before dropping.'
    ],
    relatedQueryIds: ['index-fragmentation', 'missing-indexes']
  },
  {
    id: 'single-use-ad-hoc-plans',
    title: 'Ad-hoc Query Plan Cache Bloat (Optimize for Ad Hoc Workloads)',
    category: 'Performance',
    subcategory: 'Resource Usage',
    description: 'Measure memory wasted in the plan cache by single-use ad-hoc query plans, and evaluate if "optimize for ad hoc workloads" should be enabled.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['plan-cache', 'memory', 'ad-hoc', 'optimize-for-ad-hoc', 'dm_exec_cached_plans'],
    whenToUse: 'When buffer pool memory is starved or server has millions of single-use SQL statements.',
    sql: `SELECT
    objtype AS ObjectType,
    COUNT_BIG(*) AS TotalPlans,
    SUM(CAST(size_in_bytes AS BIGINT)) / 1024 / 1024 AS TotalSizeMB,
    SUM(CASE WHEN usecounts = 1 THEN 1 ELSE 0 END) AS SingleUsePlans,
    SUM(CASE WHEN usecounts = 1 THEN CAST(size_in_bytes AS BIGINT) ELSE 0 END) / 1024 / 1024 AS SingleUseSizeMB,
    CAST(ROUND(
        (SUM(CASE WHEN usecounts = 1 THEN CAST(size_in_bytes AS BIGINT) ELSE 0 END) * 1.0 / 
         SUM(CAST(size_in_bytes AS BIGINT))) * 100, 2) AS DECIMAL(5, 2)) AS PercentWastedSingleUse
FROM sys.dm_exec_cached_plans
GROUP BY objtype
ORDER BY TotalSizeMB DESC;`,
    notes: [
      'If SingleUseSizeMB exceeds 500MB or PercentWastedSingleUse > 30%, enable the server option: EXEC sp_configure "optimize for ad hoc workloads", 1; RECONFIGURE;'
    ],
    relatedQueryIds: ['cpu-intensive-queries']
  },
  {
    id: 'long-running-queries',
    title: 'Long Running Queries & Percent Complete',
    category: 'Performance',
    subcategory: 'Active Queries',
    description: 'Track queries running longer than 1 minute, their estimated time to completion, and progress percentages (for BACKUP, RESTORE, DBCC, ROLLBACK).',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['long-running', 'percent_complete', 'estimated_completion_time', 'duration', 'progress'],
    whenToUse: 'Investigate slow batch processes or check progress of maintenance commands like CHECKDB or BACKUP.',
    sql: `SELECT
    r.session_id,
    r.command,
    r.percent_complete,
    DATEADD(SECOND, r.estimated_completion_time / 1000, GETDATE()) AS estimated_finish_time,
    r.total_elapsed_time / 1000 AS elapsed_seconds,
    (r.total_elapsed_time / 1000) / 60 AS elapsed_minutes,
    DB_NAME(r.database_id) AS database_name,
    s.login_name,
    s.program_name,
    r.wait_type,
    r.wait_time,
    t.text AS sql_text
FROM sys.dm_exec_requests r
INNER JOIN sys.dm_exec_sessions s
    ON r.session_id = s.session_id
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.session_id <> @@SPID
  AND r.total_elapsed_time > 60000 -- Running longer than 60 seconds
ORDER BY r.total_elapsed_time DESC;`,
    columnsReturned: [
      { name: 'percent_complete', description: 'Percentage finished (populated for BACKUP, RESTORE, DBCC CHECKDB, ROLLBACK)' },
      { name: 'estimated_finish_time', description: 'Predicted completion timestamp' },
      { name: 'elapsed_minutes', description: 'Total minutes query has been running' }
    ],
    relatedQueryIds: ['active-queries', 'blocking-sessions']
  }
];

