import { QuerySnippet } from '../../types';

export const troubleshootingQueries: QuerySnippet[] = [
  {
    id: 'extract-deadlocks-extended-events',
    title: 'Extract Deadlock Graphs from System Health Session',
    category: 'Troubleshooting',
    subcategory: 'Deadlocks',
    description: 'Retrieve recent XML deadlock graphs directly from the default system_health Extended Events ring buffer or event file.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['deadlock', 'system_health', 'extended-events', 'xml_deadlock_report', 'diagnostics'],
    featured: true,
    whenToUse: 'When applications log Error 1205 (Deadlock victim) and you need to view the exact lock graph and victim query.',
    sql: `SELECT
    xed.value('@timestamp', 'DATETIME2') AS DeadlockTimeUtc,
    xed.query('.') AS DeadlockGraphXml
FROM
(
    SELECT CAST(target_data AS XML) AS TargetData
    FROM sys.dm_xe_session_targets st
    INNER JOIN sys.dm_xe_sessions s
        ON s.address = st.event_session_address
    WHERE s.name = 'system_health'
      AND st.target_name = 'ring_buffer'
) AS Data
CROSS APPLY TargetData.nodes('RingBufferTarget/event[@name="xml_deadlock_report"]') AS XEvent(xed)
ORDER BY DeadlockTimeUtc DESC;`,
    columnsReturned: [
      { name: 'DeadlockTimeUtc', description: 'UTC timestamp when the deadlock occurred' },
      { name: 'DeadlockGraphXml', description: 'Interactive XML deadlock graph (open in SSMS to visualize victim and resource nodes)' }
    ],
    notes: [
      'Clicking on the XML column in SSMS and saving with a .xdl extension opens the native visual deadlock diagram.',
      'The system_health session is enabled by default in all modern SQL Server editions with near-zero overhead.'
    ],
    relatedQueryIds: ['blocking-sessions', 'blocking-tree']
  },
  {
    id: 'kill-spid-safely',
    title: 'Safely Terminate Session & Monitor Rollback (STATUSONLY)',
    category: 'Troubleshooting',
    subcategory: 'Session Inspection',
    description: 'Safely terminate an unkillable or blocking session and track the rollback completion percentage and estimated time remaining.',
    difficulty: 'Intermediate',
    risk: 'destructive',
    sqlServerVersion: '2016+',
    tags: ['kill', 'statusonly', 'rollback', 'destructive', 'spid'],
    whenToUse: 'When a critical blocker cannot be resolved normally and must be terminated, or to monitor how long a rolling-back transaction has left.',
    parameters: [
      {
        name: 'TargetSPID',
        placeholder: '65',
        description: 'Session ID (SPID) to inspect/terminate',
        defaultValue: '65'
      }
    ],
    sql: `-- Step 1: Check rollback progress of an already terminating session
KILL 65 WITH STATUSONLY;

-- Step 2: If session must be terminated:
-- ⚠️ WARNING: Terminates connection and forces rollback of all uncommitted work!
-- KILL 65;`,
    columnsReturned: [
      { name: 'spid', description: 'Session being terminated' },
      { name: 'status', description: 'Rollback status message' },
      { name: 'percent', description: 'Percentage of rollback completed' },
      { name: 'estimated_time', description: 'Remaining seconds before rollback completes' }
    ],
    warnings: [
      'NEVER restart the SQL Server service to "speed up" a slow rollback! Restarting forces Crash Recovery, which will take the same time or longer and take the entire database offline.'
    ],
    relatedQueryIds: ['blocking-sessions', 'session-input-buffer']
  },
  {
    id: 'session-input-buffer',
    title: 'Inspect Session Input Buffer (sys.dm_exec_input_buffer)',
    category: 'Troubleshooting',
    subcategory: 'Session Inspection',
    description: 'Retrieve the exact last statement or batch sent by a specific SPID (modern replacement for DBCC INPUTBUFFER).',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['input-buffer', 'dm_exec_input_buffer', 'spid', 'diagnostics'],
    whenToUse: 'When a session is idle in transaction or blocking, and you need to see the exact query string it last ran.',
    parameters: [
      {
        name: 'SPID',
        placeholder: '54',
        description: 'Session ID to inspect',
        defaultValue: '54'
      }
    ],
    sql: `SELECT 
    s.session_id,
    s.login_name,
    s.host_name,
    s.program_name,
    s.status,
    ib.event_type,
    ib.parameters,
    ib.event_info AS last_batch_text
FROM sys.dm_exec_sessions s
CROSS APPLY sys.dm_exec_input_buffer(s.session_id, NULL) ib
WHERE s.session_id = 54;`,
    relatedQueryIds: ['active-queries', 'blocking-sessions']
  },
  {
    id: 'tempdb-allocation-contention',
    title: 'Check TempDB Allocation Page Contention (PFS / GAM / SGAM)',
    category: 'Troubleshooting',
    subcategory: 'TempDB Contention',
    description: 'Detect PAGELATCH contention on TempDB allocation bitmap pages (PFS, GAM, SGAM) indicating need for multiple equal data files.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['tempdb', 'pagelatch', 'gam', 'sgam', 'pfs', 'contention'],
    whenToUse: 'When high concurrency workloads cause heavy PAGELATCH_UP waits in TempDB.',
    sql: `SELECT
    wt.session_id,
    wt.wait_type,
    wt.wait_duration_ms,
    wt.blocking_session_id,
    wt.resource_description,
    DB_NAME(wt.resource_database_id) AS DatabaseName,
    CASE 
        WHEN wt.resource_description LIKE '2:1:1' OR wt.resource_description LIKE '2:1:8088' THEN 'PFS Page Contention'
        WHEN wt.resource_description LIKE '2:1:2' THEN 'GAM Page Contention'
        WHEN wt.resource_description LIKE '2:1:3' THEN 'SGAM Page Contention'
        ELSE 'Data/Index Page Latch'
    END AS ContentionType
FROM sys.dm_os_waiting_tasks wt
WHERE wt.wait_type LIKE 'PAGELATCH_%'
  AND wt.resource_database_id = 2 -- Database 2 is always TempDB
ORDER BY wt.wait_duration_ms DESC;`,
    notes: [
      'Ensure TempDB is configured with 8 equal data files (or 1 per logical core up to 8) to distribute allocation bitmap latching.',
      'SQL Server 2016+ enables Trace Flags 1117 and 1118 by default, but multiple equal data files are still mandatory.'
    ],
    relatedQueryIds: ['tempdb-space-usage']
  },
  {
    id: 'memory-grant-pending-semaphore',
    title: 'Memory Grant Queue & RESOURCE_SEMAPHORE Waits',
    category: 'Troubleshooting',
    subcategory: 'Session Inspection',
    description: 'Detect queries stuck in the memory queue waiting for workspace memory grants (RESOURCE_SEMAPHORE), causing massive cascading stalls.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['memory-grant', 'resource_semaphore', 'workspace-memory', 'dm_exec_query_memory_grants'],
    whenToUse: 'When queries take seconds to start or applications experience connection timeouts due to memory queueing.',
    sql: `SELECT
    mg.session_id,
    mg.request_id,
    mg.scheduler_id,
    mg.dop,
    mg.request_time,
    mg.grant_time,
    mg.requested_memory_kb / 1024.0 AS RequestedMemoryMB,
    mg.granted_memory_kb / 1024.0 AS GrantedMemoryMB,
    mg.used_memory_kb / 1024.0 AS UsedMemoryMB,
    mg.queue_id,
    mg.wait_order,
    CASE WHEN mg.grant_time IS NULL THEN 'WAITING FOR MEMORY' ELSE 'RUNNING' END AS GrantStatus,
    t.text AS sql_text
FROM sys.dm_exec_query_memory_grants mg
CROSS APPLY sys.dm_exec_sql_text(mg.sql_handle) t
ORDER BY mg.requested_memory_kb DESC;`,
    notes: [
      'If GrantStatus shows "WAITING FOR MEMORY", server memory is exhausted by large sort/hash queries with excessive memory grants.',
      'Can often be mitigated by fixing out-of-date statistics or adding missing indexes to prevent huge cardinality estimates.'
    ],
    relatedQueryIds: ['active-queries', 'cpu-intensive-queries']
  },
  {
    id: 'diagnose-latch-contention',
    title: 'Top Instance Latch Waits (PAGELATCH vs PAGEIOLATCH)',
    category: 'Troubleshooting',
    subcategory: 'TempDB Contention',
    description: 'Inspect sys.dm_os_latch_stats to differentiate between memory thread latching (PAGELATCH) and physical disk read waits (PAGEIOLATCH).',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['latch', 'pagelatch', 'pageiolatch', 'concurrency', 'sys.dm_os_latch_stats'],
    whenToUse: 'When isolating whether performance degradation stems from memory thread concurrency or physical storage subsystem throughput.',
    sql: `SELECT TOP 15
    latch_class,
    waiting_requests_count AS WaitCount,
    wait_time_ms / 1000.0 AS WaitTimeSeconds,
    (wait_time_ms / waiting_requests_count) AS AvgWaitTimeMs,
    max_wait_time_ms
FROM sys.dm_os_latch_stats
WHERE waiting_requests_count > 0
ORDER BY wait_time_ms DESC;`,
    notes: [
      'PAGELATCH_* → Synchronization mechanism for 8KB pages already in memory (memory thread contention).',
      'PAGEIOLATCH_* → Waiting for 8KB pages to be read from disk into the buffer pool (disk subsystem speed).'
    ],
    relatedQueryIds: ['wait-statistics-summary', 'tempdb-allocation-contention']
  }
];

