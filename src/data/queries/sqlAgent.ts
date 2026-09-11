import { QuerySnippet } from '../../types';

export const sqlAgentQueries: QuerySnippet[] = [
  {
    id: 'find-agent-job-by-step-name',
    title: 'Find SQL Agent Job by Step Name',
    category: 'SQL Server Agent',
    subcategory: 'Job Search',
    description: 'Find SQL Agent jobs where a specific step name matches a target stored procedure or keyword.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['agent', 'jobs', 'steps', 'step_name', 'msdb', 'sysjobs', 'sysjobsteps'],
    featured: true,
    whenToUse: 'Quickly find which Agent job contains a specific step name or task.',
    parameters: [
      {
        name: 'StepPattern',
        placeholder: '%usp_move_mis_missing_data_coverage%',
        description: 'Step name pattern to search for',
        defaultValue: '%usp_move_mis_missing_data_coverage%'
      }
    ],
    sql: `SELECT
    j.name AS job_name,
    j.enabled,
    s.step_id,
    s.step_name,
    s.subsystem,
    s.command
FROM msdb.dbo.sysjobs AS j
INNER JOIN msdb.dbo.sysjobsteps AS s
    ON s.job_id = j.job_id
WHERE s.step_name LIKE '%usp_move_mis_missing_data_coverage%';`,
    columnsReturned: [
      { name: 'job_name', description: 'Name of the SQL Server Agent job' },
      { name: 'enabled', description: '1 = Enabled, 0 = Disabled' },
      { name: 'step_id', description: 'Sequence number of the step' },
      { name: 'step_name', description: 'Name of the job step' },
      { name: 'command', description: 'T-SQL or SSIS package command executed in this step' }
    ],
    relatedQueryIds: ['find-agent-job-by-procedure', 'currently-running-jobs']
  },
  {
    id: 'find-agent-job-by-procedure',
    title: 'Find SQL Agent Job by Procedure in Command Text',
    category: 'SQL Server Agent',
    subcategory: 'Job Search',
    description: 'Search inside the actual T-SQL command script of all job steps across msdb to find where a stored procedure is executed.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['agent', 'job', 'procedure', 'command', 'search', 'sysjobsteps'],
    featured: true,
    whenToUse: 'When modifying or deprecating a stored procedure and verifying which scheduled jobs execute it.',
    parameters: [
      {
        name: 'ProcedureName',
        placeholder: 'usp_move_mis_missing_data_coverage',
        description: 'Procedure name to search within command text',
        defaultValue: 'usp_move_mis_missing_data_coverage'
      }
    ],
    sql: `SELECT
    j.name AS JobName,
    j.enabled AS IsJobEnabled,
    s.step_id AS StepID,
    s.step_name AS StepName,
    s.database_name AS DatabaseContext,
    s.command AS StepCommand
FROM msdb.dbo.sysjobs j
INNER JOIN msdb.dbo.sysjobsteps s
    ON j.job_id = s.job_id
WHERE s.command LIKE '%usp_move_mis_missing_data_coverage%'
ORDER BY j.name, s.step_id;`,
    columnsReturned: [
      { name: 'JobName', description: 'Name of the job executing the procedure' },
      { name: 'IsJobEnabled', description: '1 = Job is active and scheduled' },
      { name: 'StepID', description: 'Step index within job flow' },
      { name: 'DatabaseContext', description: 'Database where the step executes' },
      { name: 'StepCommand', description: 'Full T-SQL command text executed' }
    ],
    relatedQueryIds: ['find-agent-job-by-step-name', 'failed-job-history']
  },
  {
    id: 'currently-running-jobs',
    title: 'Find Currently Running SQL Agent Jobs',
    category: 'SQL Server Agent',
    subcategory: 'Job Execution',
    description: 'Inspect currently executing SQL Agent jobs, active step number, and running duration.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['agent', 'running-jobs', 'sysjobactivity', 'duration', 'monitoring'],
    whenToUse: 'Determine which background Agent jobs are running when server load is high or before running ad-hoc batch jobs.',
    sql: `SELECT
    ja.job_id,
    j.name AS job_name,
    ja.start_execution_date,
    DATEDIFF(MINUTE, ja.start_execution_date, GETDATE()) AS duration_minutes,
    ISNULL(ja.last_executed_step_id, 0) + 1 AS current_executing_step,
    js.step_name AS current_step_name
FROM msdb.dbo.sysjobactivity ja
INNER JOIN msdb.dbo.sysjobs j
    ON ja.job_id = j.job_id
LEFT JOIN msdb.dbo.sysjobsteps js
    ON ja.job_id = js.job_id
    AND js.step_id = ISNULL(ja.last_executed_step_id, 0) + 1
WHERE ja.session_id = (SELECT TOP 1 session_id FROM msdb.dbo.syssessions ORDER BY agent_start_date DESC)
  AND ja.start_execution_date IS NOT NULL
  AND ja.stop_execution_date IS NULL
ORDER BY ja.start_execution_date;`,
    columnsReturned: [
      { name: 'job_name', description: 'Name of the job currently executing' },
      { name: 'start_execution_date', description: 'Timestamp when this run started' },
      { name: 'duration_minutes', description: 'Elapsed minutes since start' },
      { name: 'current_executing_step', description: 'Step number currently in progress' },
      { name: 'current_step_name', description: 'Name of the running step' }
    ],
    relatedQueryIds: ['failed-job-history', 'active-queries']
  },
  {
    id: 'failed-job-history',
    title: 'Find Failed SQL Agent Jobs (Last 24 Hours)',
    category: 'SQL Server Agent',
    subcategory: 'Job History & Schedules',
    description: 'Query msdb job history to identify jobs and steps that failed recently with the exact failure error message.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['agent', 'failures', 'history', 'errors', 'sysjobhistory'],
    whenToUse: 'Morning daily checks or troubleshooting alerts from failed nocturnal batch processes.',
    sql: `SELECT
    j.name AS JobName,
    h.step_id AS StepID,
    h.step_name AS StepName,
    -- Convert Agent integer date and time to DATETIME
    msdb.dbo.agent_datetime(h.run_date, h.run_time) AS RunDateTime,
    h.run_duration / 10000 AS Hours,
    (h.run_duration % 10000) / 100 AS Minutes,
    (h.run_duration % 100) AS Seconds,
    h.message AS ErrorMessage
FROM msdb.dbo.sysjobhistory h
INNER JOIN msdb.dbo.sysjobs j
    ON h.job_id = j.job_id
WHERE h.run_status = 0 -- 0 = Failed, 1 = Succeeded, 2 = Retry, 3 = Canceled
  AND msdb.dbo.agent_datetime(h.run_date, h.run_time) >= DATEADD(DAY, -1, GETDATE())
ORDER BY RunDateTime DESC;`,
    columnsReturned: [
      { name: 'JobName', description: 'Name of the failed job' },
      { name: 'StepName', description: 'Specific step that crashed' },
      { name: 'RunDateTime', description: 'Readable timestamp of the failure' },
      { name: 'ErrorMessage', description: 'Full error text reported back to Agent' }
    ],
    relatedQueryIds: ['currently-running-jobs', 'find-agent-job-by-procedure']
  },
  {
    id: 'job-schedules-inspection',
    title: 'Inspect SQL Agent Job Schedules & Next Run Time',
    category: 'SQL Server Agent',
    subcategory: 'Job History & Schedules',
    description: 'View schedules, frequencies, enabled status, and next scheduled execution timestamp for all jobs.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['schedules', 'frequency', 'next_run_date', 'cron', 'sysschedules'],
    whenToUse: 'Check when jobs are set to run next or audit recurring schedules.',
    sql: `SELECT
    j.name AS JobName,
    j.enabled AS JobEnabled,
    s.name AS ScheduleName,
    s.enabled AS ScheduleEnabled,
    CASE s.freq_type
        WHEN 1 THEN 'One time only'
        WHEN 4 THEN 'Daily'
        WHEN 8 THEN 'Weekly'
        WHEN 16 THEN 'Monthly'
        WHEN 64 THEN 'When SQL Agent starts'
        WHEN 128 THEN 'When computer is idle'
        ELSE 'Other'
    END AS Frequency,
    CASE 
        WHEN js.next_run_date = 0 THEN NULL
        ELSE msdb.dbo.agent_datetime(js.next_run_date, js.next_run_time)
    END AS NextRunDateTime
FROM msdb.dbo.sysjobs j
INNER JOIN msdb.dbo.sysjobschedules js
    ON j.job_id = js.job_id
INNER JOIN msdb.dbo.sysschedules s
    ON js.schedule_id = s.schedule_id
ORDER BY NextRunDateTime, j.name;`,
    columnsReturned: [
      { name: 'JobName', description: 'Agent Job name' },
      { name: 'Frequency', description: 'Daily, Weekly, Monthly, etc.' },
      { name: 'NextRunDateTime', description: 'Upcoming run time' }
    ],
    relatedQueryIds: ['currently-running-jobs']
  },
  {
    id: 'enable-disable-agent-job',
    title: 'Enable / Disable SQL Agent Job',
    category: 'SQL Server Agent',
    subcategory: 'Job Execution',
    description: 'Use sp_update_job to toggle enabled state of a SQL Agent job during maintenance or debugging.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['sp_update_job', 'enable', 'disable', 'maintenance'],
    whenToUse: 'Temporarily pause a recurring job to prevent conflicts with data migration or index maintenance.',
    parameters: [
      {
        name: 'JobName',
        placeholder: "'Daily Data Sync'",
        description: 'Target Job name',
        defaultValue: "'Daily Data Sync'"
      },
      {
        name: 'EnabledValue',
        placeholder: '0',
        description: '0 = Disable, 1 = Enable',
        defaultValue: '0'
      }
    ],
    sql: `-- To DISABLE a job:
EXEC msdb.dbo.sp_update_job 
    @job_name = N'Daily Data Sync', 
    @enabled = 0;

-- To ENABLE a job:
-- EXEC msdb.dbo.sp_update_job 
--     @job_name = N'Daily Data Sync', 
--     @enabled = 1;`,
    notes: [
      'Disabling a job does not cancel a currently executing instance of it.'
    ],
    relatedQueryIds: ['currently-running-jobs']
  },
  {
    id: 'find-jobs-containing-text',
    title: 'Search All Agent Jobs for Specific Text or Connection String',
    category: 'SQL Server Agent',
    subcategory: 'Job Search',
    description: 'Deep search across job descriptions, step commands, and step names for server names, emails, or table references.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['agent-search', 'grep-jobs', 'step-command', 'msdb'],
    whenToUse: 'When decommissioning a server or email distribution list and finding all agent jobs referencing it.',
    parameters: [
      {
        name: 'SearchQuery',
        placeholder: "'backup_server'",
        description: 'Text string to search for across jobs',
        defaultValue: "'backup_server'"
      }
    ],
    sql: `SELECT
    j.name AS JobName,
    j.enabled AS IsJobEnabled,
    s.step_id AS StepID,
    s.step_name AS StepName,
    s.subsystem AS Subsystem,
    s.command AS CommandText
FROM msdb.dbo.sysjobs j
INNER JOIN msdb.dbo.sysjobsteps s
    ON j.job_id = s.job_id
WHERE s.command LIKE '%backup_server%'
   OR j.name LIKE '%backup_server%'
   OR j.description LIKE '%backup_server%'
ORDER BY j.name, s.step_id;`,
    relatedQueryIds: ['find-agent-job-by-procedure']
  },
  {
    id: 'find-enabled-vs-disabled-jobs',
    title: 'Audit All Jobs by Category, Owner & Enabled Status',
    category: 'SQL Server Agent',
    subcategory: 'Job Execution',
    description: 'Inventory all SQL Agent jobs with job categories, Windows/SQL owners, creation date, and enabled status.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['audit-jobs', 'job-owner', 'categories', 'msdb'],
    whenToUse: 'Quarterly database audits and ownership cleanup.',
    sql: `SELECT
    j.name AS JobName,
    c.name AS CategoryName,
    SUSER_SNAME(j.owner_sid) AS JobOwner,
    CASE j.enabled WHEN 1 THEN 'Enabled' ELSE 'Disabled' END AS EnabledStatus,
    j.date_created,
    j.date_modified,
    j.description
FROM msdb.dbo.sysjobs j
INNER JOIN msdb.dbo.syscategories c
    ON j.category_id = c.category_id
ORDER BY j.enabled DESC, CategoryName, JobName;`,
    relatedQueryIds: ['find-agent-job-by-step-name']
  }
];

