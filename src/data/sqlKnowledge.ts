export interface QueryStatusDetail {
  id: string;
  status: string;
  title: string;
  badge: {
    label: string;
    lightClass: string;
    darkClass: string;
  };
  threadState: string;
  dmvSource: string;
  summary: string;
  whatItMeans: string;
  healthEvaluation: {
    level: 'Normal' | 'Caution' | 'Danger' | 'Informational';
    explanation: string;
  };
  causesAndScenarios: string[];
  diagnosticQuery: string;
  troubleshootingSteps: string[];
}

export interface SqlWaitTypeSummary {
  waitType: string;
  category: 'Disk I/O' | 'Concurrency & Locks' | 'Network / Client' | 'Parallelism' | 'Memory Workspace' | 'Transaction Log';
  meaning: string;
  isNormal: string;
  action: string;
  diagnosticSql: string;
}

export interface ExecutionLifecycleStep {
  stepNumber: number;
  name: string;
  statusName: string;
  actor: string;
  description: string;
  transitionTrigger: string;
}

export const QUERY_STATUSES: QueryStatusDetail[] = [
  {
    id: 'running',
    status: 'RUNNING',
    title: 'Actively Burning CPU Cycles',
    badge: {
      label: 'RUNNING (Active on CPU)',
      lightClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      darkClass: 'dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30',
    },
    threadState: 'On CPU — Executing machine instructions on a logical CPU core right now.',
    dmvSource: 'sys.dm_exec_requests.status = \'running\'',
    summary: 'The query thread currently owns a CPU scheduler core and is executing computations, sorting, filtering, or evaluating expressions.',
    whatItMeans: 'In SQL Server\'s cooperative OS (SQLOS), each logical CPU core has one Scheduler. At any given microsecond, exactly ONE worker thread can be RUNNING per scheduler. When a request is marked RUNNING, it is actively executing operators such as scanning in-memory buffers, computing hash tables, executing mathematical functions, or filtering predicates.',
    healthEvaluation: {
      level: 'Normal',
      explanation: 'Completely normal for queries during active execution. However, if a single query remains RUNNING continuously for tens of seconds or minutes without yielding, it is consuming disproportionate CPU (CPU hog).',
    },
    causesAndScenarios: [
      'Performing CPU-intensive aggregations, grouping, or window functions over millions of rows.',
      'Scalar User-Defined Functions (UDFs) executed per-row (e.g., dbo.fn_FormatString(col)).',
      'Missing index causing Nested Loops Join with massive row estimations (doing millions of in-memory loop comparisons).',
      'Heavy string operations (LIKE \'%search%\', REPLACE, RegEx/CLR, or complex CASE statements).',
      'Implicit data type conversions forcing SQL Server to convert column types on every evaluated row (CONVERT_IMPLICIT).',
    ],
    diagnosticQuery: `-- Inspect queries currently marked RUNNING and their CPU usage
SELECT 
    r.session_id,
    r.status,
    r.command,
    r.cpu_time AS [cpu_time_ms],
    r.total_elapsed_time AS [elapsed_time_ms],
    r.logical_reads,
    SUBSTRING(t.text, (r.statement_start_offset/2)+1, 
        (((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(t.text) ELSE r.statement_end_offset END) - r.statement_start_offset)/2) + 1) AS [active_statement],
    qp.query_plan
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
CROSS APPLY sys.dm_exec_query_plan(r.plan_handle) qp
WHERE r.status = 'running'
  AND r.session_id <> @@SPID
ORDER BY r.cpu_time DESC;`,
    troubleshootingSteps: [
      'Inspect the graphical execution plan: Look for missing index recommendations or high-cost Sort / Hash Match operators.',
      'Check for Scalar Functions in SELECT or WHERE clauses and refactor them into inline table-valued functions or CTEs.',
      'Examine whether unindexed columns are being compared with incompatible data types, triggering per-row conversion.',
      'Verify if MAXDOP (Maximum Degree of Parallelism) or Cost Threshold for Parallelism needs tuning.',
    ],
  },
  {
    id: 'suspended',
    status: 'SUSPENDED',
    title: 'Waiting for a Resource or Lock',
    badge: {
      label: 'SUSPENDED (Waiting on Resource)',
      lightClass: 'bg-amber-100 text-amber-950 border-amber-300',
      darkClass: 'dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30',
    },
    threadState: 'Off CPU — Thread has yielded the CPU and is in the Wait List waiting for an event.',
    dmvSource: 'sys.dm_exec_requests.status = \'suspended\' (and sys.dm_os_waiting_tasks)',
    summary: 'The query wanted to proceed, but hit a roadblock: it needs a physical disk read, a table/row lock, memory allocation, or network response.',
    whatItMeans: 'When a running query needs something that isn\'t instantly available in RAM, it voluntarily yields the CPU core so other queries aren\'t starved. It places itself into a SUSPENDED state and joins a Waiter List. As soon as the awaited resource arrives (e.g., the disk subsystem finishes reading the data page into memory, or a blocking transaction commits and drops its lock), SQLOS signals the thread and moves it to the RUNNABLE queue.',
    healthEvaluation: {
      level: 'Caution',
      explanation: 'Brief SUSPENDED states are normal (e.g. 5ms to read disk pages). However, long SUSPENDED states on LCK_M_* indicate severe user blocking, while RESOURCE_SEMAPHORE indicates total memory exhaustion.',
    },
    causesAndScenarios: [
      'LCK_M_* (e.g. LCK_M_X, LCK_M_IX, LCK_M_S): The query is blocked waiting for another transaction to release a lock on a table or row.',
      'PAGEIOLATCH_SH / PAGEIOLATCH_EX: The query requested a page that is not in the Buffer Pool (RAM) and must be read from physical SSD/HDD disk.',
      'ASYNC_NETWORK_IO: SQL Server has finished computing rows, but the client application (e.g. .NET API, reporting service, or SSMS) is taking its time consuming packets over TCP socket.',
      'RESOURCE_SEMAPHORE: Query requires a large memory workspace for sorting/hashing, but server memory is exhausted by other queries.',
      'CXPACKET / CXCONSUMER: Parallel worker threads waiting to synchronize and exchange rows with each other.',
      'WRITELOG: Transaction waiting for SQL Server to flush its log buffer to the transaction log (.ldf file) on disk during COMMIT.',
    ],
    diagnosticQuery: `-- Check currently SUSPENDED queries, what they are waiting for, and who is blocking them
SELECT 
    r.session_id,
    r.status,
    r.blocking_session_id AS [blocked_by_spid],
    r.wait_type,
    r.wait_time AS [wait_time_ms],
    r.wait_resource,
    r.command,
    DB_NAME(r.database_id) AS [database_name],
    SUBSTRING(t.text, (r.statement_start_offset/2)+1, 
        (((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(t.text) ELSE r.statement_end_offset END) - r.statement_start_offset)/2) + 1) AS [sql_statement]
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.status = 'suspended'
ORDER BY r.wait_time DESC;`,
    troubleshootingSteps: [
      'Look at wait_type immediately: If it starts with LCK_M_*, check blocking_session_id to find and address the root blocking transaction.',
      'If PAGEIOLATCH_*, check if queries are doing full table scans due to missing indexes, overloading the storage subsystem.',
      'If ASYNC_NETWORK_IO, the database is fast, but the frontend code is slow (e.g., reading row-by-row with DataReader without buffering, or fetching millions of unpaged rows).',
      'If RESOURCE_SEMAPHORE, optimize massive sorts/joins with appropriate indexes or reduce concurrent memory-hungry batches.',
    ],
  },
  {
    id: 'runnable',
    status: 'RUNNABLE',
    title: 'Ready to Run, Queued for CPU',
    badge: {
      label: 'RUNNABLE (Waiting for CPU Core)',
      lightClass: 'bg-sky-100 text-sky-950 border-sky-300',
      darkClass: 'dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30',
    },
    threadState: 'Ready to Execute — Waiting in the scheduler\'s queue for an available CPU core.',
    dmvSource: 'sys.dm_exec_requests.status = \'runnable\' (and sys.dm_os_schedulers.runnable_tasks_count)',
    summary: 'The query has all necessary data in RAM, has acquired all locks, and has all resources—it is just waiting in line for an available CPU core.',
    whatItMeans: 'The query is fully ready to execute, but all CPU cores on the server are 100% occupied by other RUNNING threads. It is placed in the Scheduler\'s Runnable Queue (first-come, first-served). The time a thread spends in this queue is measured by SQL Server as "Signal Wait Time" (the time between being signaled that a resource is ready and actually getting CPU time).',
    healthEvaluation: {
      level: 'Danger',
      explanation: 'A few threads briefly in RUNNABLE is expected under heavy concurrency. However, having a continuous backlog of RUNNABLE queries is the gold standard indicator of CPU Pressure / CPU Starvation.',
    },
    causesAndScenarios: [
      'Severe CPU pressure: Server CPU utilization is consistently near 90–100%.',
      'Too many parallel queries flooding the schedulers with sub-threads.',
      'A storm of high-frequency short queries overwhelming the logical processors.',
      'High number of Runnable Tasks on sys.dm_os_schedulers with signal_wait_time_ms > 20% of total waits.',
      'Insufficient virtual CPU core allocation on VM or cloud instance.',
    ],
    diagnosticQuery: `-- Check CPU pressure: Runnable tasks queued on each CPU Scheduler
SELECT 
    scheduler_id,
    cpu_id,
    status,
    is_online,
    current_tasks_count,
    runnable_tasks_count, -- High numbers (> 2-3 per core) mean CPU bottleneck
    work_queue_count,
    pending_disk_io_count
FROM sys.dm_os_schedulers
WHERE status = 'VISIBLE ONLINE'
ORDER BY runnable_tasks_count DESC;`,
    troubleshootingSteps: [
      'Check signal wait percentage: Signal Waits / Total Waits. If > 20%, CPU bottleneck is verified.',
      'Find the queries with the highest total worker_time (CPU time) in sys.dm_exec_query_stats and tune their indexing.',
      'Increase the Cost Threshold for Parallelism (default is 5, recommend 50+) to prevent trivial queries from parallelizing across all CPU cores.',
      'Ensure Virtual Machine CPU topology matches physical NUMA nodes and hyper-threading settings.',
    ],
  },
  {
    id: 'sleeping',
    status: 'SLEEPING',
    title: 'Connection Idle / Awaiting Application Batch',
    badge: {
      label: 'SLEEPING (Idle Connection)',
      lightClass: 'bg-slate-100 text-slate-900 border-slate-300',
      darkClass: 'dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    threadState: 'No active query — Connection is established, waiting for application input.',
    dmvSource: 'sys.dm_exec_sessions.status = \'sleeping\'',
    summary: 'The client application has an open connection in the pool, but is not currently sending any query commands.',
    whatItMeans: 'In sys.dm_exec_sessions, when an application finishes executing a batch, the session transitions to SLEEPING. Connection pooling libraries (like ADO.NET, HikariCP, Node pg, EF Core) keep pools of idle connections alive to avoid the TCP handshake cost of reconnecting.',
    healthEvaluation: {
      level: 'Caution',
      explanation: 'SLEEPING by itself is healthy. BUT: A SLEEPING session with open_transaction_count > 0 is a toxic Transaction Leak holding locks and blocking everyone else!',
    },
    causesAndScenarios: [
      'Normal connection pooling: Application holds connections in reserve.',
      'Toxic Scenario 1: Developer started "BEGIN TRAN" in SSMS, ran an update, and walked away for lunch without running COMMIT.',
      'Toxic Scenario 2: Application started a database transaction, sent a slow REST API / payment gateway request outside the DB, and left the transaction hanging.',
      'Toxic Scenario 3: Application encountered an unhandled exception in C# / Java / Python without a proper "using(transaction)" or try/catch ROLLBACK block.',
    ],
    diagnosticQuery: `-- CRITICAL: Detect "Zombie" Sleeping sessions holding uncommitted open transactions
SELECT 
    s.session_id,
    s.login_name,
    s.host_name,
    s.program_name,
    s.status,
    s.open_transaction_count,
    DATEDIFF(SECOND, s.last_request_end_time, GETDATE()) AS [idle_seconds_with_open_tran],
    t.text AS [last_executed_sql]
FROM sys.dm_exec_sessions s
CROSS APPLY sys.dm_exec_sql_text(s.most_recent_sql_handle) t
WHERE s.status = 'sleeping'
  AND s.open_transaction_count > 0
ORDER BY s.last_request_end_time ASC;`,
    troubleshootingSteps: [
      'Identify any session with open_transaction_count > 0 and high idle_seconds.',
      'Investigate host_name and program_name to trace the offending developer or service.',
      'If blocking critical production users, safely terminate the session with KILL <spid> (this will trigger a clean rollback).',
      'In application code, ensure transactions are enclosed in using / try-finally blocks, or enforce SET XACT_ABORT ON.',
    ],
  },
  {
    id: 'rollback',
    status: 'ROLLBACK',
    title: 'Active Transaction Log Rollback',
    badge: {
      label: 'ROLLBACK (Undoing Changes)',
      lightClass: 'bg-rose-100 text-rose-950 border-rose-300',
      darkClass: 'dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30',
    },
    threadState: 'Active Undo — Reading the transaction log backwards to undo data mutations.',
    dmvSource: 'sys.dm_exec_requests.status = \'rollback\'',
    summary: 'A query was aborted, timed out, chosen as a deadlock victim, or terminated via KILL, and SQL Server is reverting its changes.',
    whatItMeans: 'In relational database ACID properties, Atomicity dictates that a transaction must either complete entirely or not at all. When an error, explicit ROLLBACK, or KILL occurs on an active transaction that made modifications (INSERT, UPDATE, DELETE), SQL Server reads the log records backwards and writes compensating undo records to restore previous row values.',
    healthEvaluation: {
      level: 'Danger',
      explanation: 'Rollback is protecting data integrity. NEVER kill a session that is already in ROLLBACK! Doing so will not speed up the process and can cause the entire database to enter Recovery Pending state.',
    },
    causesAndScenarios: [
      'Explicit ROLLBACK TRANSACTION command executed following an error.',
      'Session was selected as a Deadlock Victim (Error 1205) by the SQL Server lock engine.',
      'Client connection timed out or socket disconnected mid-mutation.',
      'DBA executed KILL <spid> on an active modifying query.',
    ],
    diagnosticQuery: `-- Check estimated percentage complete and remaining time for a rollback
KILL 65 WITH STATUSONLY; -- Replace 65 with the session_id in rollback
-- Output returns: "spid 65: transaction rollback in progress. Estimated rollback completion: 48%. Estimated time remaining: 120 seconds."`,
    troubleshootingSteps: [
      'DO NOT restart the SQL Server service or kill the session again! Restarting will only force SQL Server to redo and rollback upon startup, keeping the DB offline.',
      'Run KILL <spid> WITH STATUSONLY to view estimated percentage and seconds remaining.',
      'Monitor disk I/O on the transaction log file drive (.ldf) to ensure progress is being made.',
      'For future queries, chunk giant updates/deletes into batches (e.g. 5,000 rows per batch) to avoid massive single-transaction rollbacks.',
    ],
  },
  {
    id: 'background',
    status: 'BACKGROUND',
    title: 'Internal System Engine Worker',
    badge: {
      label: 'BACKGROUND (Internal Engine Task)',
      lightClass: 'bg-indigo-100 text-indigo-950 border-indigo-300',
      darkClass: 'dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/30',
    },
    threadState: 'Internal Worker — Executing SQLOS maintenance or background subsystem task.',
    dmvSource: 'sys.dm_exec_requests.status = \'background\' (session_id typically <= 50)',
    summary: 'Internal engine tasks managed by SQL Server to maintain storage, buffer memory, log flushes, and background cleanup.',
    whatItMeans: 'SQL Server spawns dedicated internal system threads on startup. These threads handle background chores without user intervention, such as Lazy Writer, Log Writer, Checkpoint, Ghost Record Cleanup, and Deadlock Detection.',
    healthEvaluation: {
      level: 'Informational',
      explanation: 'Completely normal and vital for database engine health and persistence.',
    },
    causesAndScenarios: [
      'CHECKPOINT: Writing dirty data pages from RAM buffer pool to physical database files (.mdf/.ndf).',
      'LOG WRITER: Flushing transaction log records from memory cache to physical log files (.ldf).',
      'LAZY WRITER: Periodically sweeping buffer cache to free clean pages and make room for incoming queries.',
      'GHOST CLEANUP: Deleting index leaf stub records left behind after DELETE statements.',
      'LOCK MONITOR: Periodic thread checking for cyclical lock waits (deadlocks) every 5 seconds.',
    ],
    diagnosticQuery: `-- View active internal background tasks running in SQL Server
SELECT 
    session_id,
    status,
    command,
    cpu_time,
    total_elapsed_time,
    reads,
    writes
FROM sys.dm_exec_requests
WHERE status = 'background'
ORDER BY session_id ASC;`,
    troubleshootingSteps: [
      'These threads cannot and should not be killed or interrupted.',
      'If CHECKPOINT or LOG WRITER show extremely high elapsed time or writes, check disk I/O latency on your storage drives.',
    ],
  },
];

export const SQLOS_LIFECYCLE_STEPS: ExecutionLifecycleStep[] = [
  {
    stepNumber: 1,
    name: 'Batch Arrival & Compilation',
    statusName: 'RUNNABLE Queue Entry',
    actor: 'Client Application & Parser',
    description: 'Client application transmits a T-SQL batch over TDS (Tabular Data Stream). SQLOS assigns a session and parses/optimizes the statement into an execution plan.',
    transitionTrigger: 'Plan generated; worker assigned and placed on Scheduler queue.',
  },
  {
    stepNumber: 2,
    name: 'Queued on Scheduler',
    statusName: 'RUNNABLE',
    actor: 'SOS Scheduler',
    description: 'Worker thread is waiting on the scheduler\'s runnable queue for an available CPU core. If CPU cores are busy, it waits in line (measured as Signal Wait Time).',
    transitionTrigger: 'A logical CPU core finishes its current task and picks up this worker.',
  },
  {
    stepNumber: 3,
    name: 'Executing on CPU Core',
    statusName: 'RUNNING',
    actor: 'Logical CPU Core',
    description: 'Worker thread executes operators on the CPU (filters, aggregates, sorts in RAM). It can run for up to a 4-millisecond quantum.',
    transitionTrigger: 'Either completes, hits a resource need (I/O, lock), or its 4ms quantum expires.',
  },
  {
    stepNumber: 4,
    name: 'Yielding on Resource Wait',
    statusName: 'SUSPENDED',
    actor: 'Wait Subsystem',
    description: 'Query needs a disk read (PAGEIOLATCH), an exclusive lock (LCK_M_*), or client socket data. It voluntarily yields CPU and joins the Wait List.',
    transitionTrigger: 'Resource event arrives (e.g. storage returns data page, or lock is freed).',
  },
  {
    stepNumber: 5,
    name: 'Re-entering CPU Queue',
    statusName: 'RUNNABLE',
    actor: 'SOS Scheduler',
    description: 'Now that the awaited resource is ready, the thread leaves the Wait List and re-enters the scheduler\'s Runnable Queue.',
    transitionTrigger: 'Next CPU core becomes free and resumes executing this worker thread.',
  },
  {
    stepNumber: 6,
    name: 'Completion & Idle State',
    statusName: 'SLEEPING',
    actor: 'Connection Pool',
    description: 'Results stream back to client. Query request completes and disappears from sys.dm_exec_requests. Session sits in connection pool awaiting next command.',
    transitionTrigger: 'Client application submits next SQL query or closes connection.',
  },
];

export const TOP_WAIT_TYPES: SqlWaitTypeSummary[] = [
  {
    waitType: 'PAGEIOLATCH_SH / PAGEIOLATCH_EX',
    category: 'Disk I/O',
    meaning: 'Waiting to read or write a data page from physical disk into the SQL Server Buffer Pool (RAM).',
    isNormal: 'Brief waits under 10ms are expected when reading data not cached in RAM. High waits (>15-20ms) mean slow storage or queries scanning millions of unindexed pages.',
    action: 'Add missing covering indexes to turn table scans into index seeks. Check disk IOPS and storage latency.',
    diagnosticSql: `SELECT TOP 10 wait_type, waiting_tasks_count, wait_time_ms, max_wait_time_ms 
FROM sys.dm_os_wait_stats 
WHERE wait_type LIKE 'PAGEIOLATCH%' 
ORDER BY wait_time_ms DESC;`,
  },
  {
    waitType: 'LCK_M_* (LCK_M_X, LCK_M_S, LCK_M_IX)',
    category: 'Concurrency & Locks',
    meaning: 'The query is blocked waiting for another transaction to release an incompatible lock on a row, page, or table.',
    isNormal: 'Brief lock contention is part of ACID. Sustained lock waits indicate long-running transactions, missing indexes causing table locks, or uncommitted transactions.',
    action: 'Identify the root blocking session using sys.dm_exec_requests. Keep transactions short. Ensure WHERE clauses use indexes so locks are fine-grained (row/key) instead of table-level.',
    diagnosticSql: `SELECT r.session_id, r.blocking_session_id, r.wait_type, r.wait_time, t.text 
FROM sys.dm_exec_requests r 
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t 
WHERE r.wait_type LIKE 'LCK_M%' 
ORDER BY r.wait_time DESC;`,
  },
  {
    waitType: 'ASYNC_NETWORK_IO',
    category: 'Network / Client',
    meaning: 'SQL Server has finished computing the results, but the client application is taking too long to consume the stream over the network.',
    isNormal: 'Very common misconception: this is NOT a database performance issue! It is almost always a slow or inefficient client application.',
    action: 'Check frontend application code: Avoid row-by-row (RBAR) processing in DataReader. Use pagination (OFFSET/FETCH) instead of streaming 50,000 rows to the UI.',
    diagnosticSql: `SELECT session_id, wait_type, wait_time, command 
FROM sys.dm_exec_requests 
WHERE wait_type = 'ASYNC_NETWORK_IO';`,
  },
  {
    waitType: 'CXPACKET / CXCONSUMER',
    category: 'Parallelism',
    meaning: 'Parallel worker threads coordinating and exchanging rows with each other.',
    isNormal: 'CXCONSUMER is completely normal idle wait. High CXPACKET combined with high CPU indicates uneven row distribution across parallel threads.',
    action: 'Increase "Cost Threshold for Parallelism" from default 5 to 50. Tune MAXDOP according to physical NUMA cores.',
    diagnosticSql: `SELECT wait_type, waiting_tasks_count, wait_time_ms 
FROM sys.dm_os_wait_stats 
WHERE wait_type IN ('CXPACKET', 'CXCONSUMER');`,
  },
  {
    waitType: 'RESOURCE_SEMAPHORE',
    category: 'Memory Workspace',
    meaning: 'Query cannot start executing because SQL Server has exhausted its memory workspace grant pool for Sort/Hash joins.',
    isNormal: 'NEVER normal! This is a critical indicator of memory starvation. Multiple heavy queries are requesting multi-gigabyte memory grants simultaneously.',
    action: 'Add indexes to eliminate explicit SORT operators. Reduce max concurrency of memory-hungry batch queries.',
    diagnosticSql: `SELECT requested_memory_kb, granted_memory_kb, is_next_candidate 
FROM sys.dm_exec_query_memory_grants 
ORDER BY requested_memory_kb DESC;`,
  },
  {
    waitType: 'WRITELOG',
    category: 'Transaction Log',
    meaning: 'A transaction executed COMMIT and is waiting for the in-memory log cache to flush to the physical .ldf transaction log file on disk.',
    isNormal: 'Should be under 2–5ms on SSDs. High WRITELOG latency directly limits transaction throughput for all INSERT, UPDATE, and DELETE queries.',
    action: 'Ensure the .ldf file is hosted on dedicated, ultra-low latency NVMe/SSD storage. Avoid doing single-row commits in loops.',
    diagnosticSql: `SELECT wait_type, waiting_tasks_count, wait_time_ms, wait_time_ms / NULLIF(waiting_tasks_count, 0) AS [avg_wait_ms] 
FROM sys.dm_os_wait_stats 
WHERE wait_type = 'WRITELOG';`,
  },
];
