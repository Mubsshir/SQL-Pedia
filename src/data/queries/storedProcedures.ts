import { QuerySnippet } from '../../types';

export const storedProceduresQueries: QuerySnippet[] = [
  {
    id: 'find-procedure-by-text',
    title: 'Find Stored Procedures Containing Text',
    category: 'Stored Procedures',
    subcategory: 'Search & Definitions',
    description: 'Search across the definition text of all stored procedures, functions, triggers, and views in sys.sql_modules.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['search', 'sql_modules', 'definition', 'find-procedure', 'grep'],
    featured: true,
    whenToUse: 'When locating where a specific table, column, error code, or variable name is used in database code.',
    parameters: [
      {
        name: 'SearchText',
        placeholder: "'CustomerOrder'",
        description: 'Text or symbol to search for',
        defaultValue: "'CustomerOrder'"
      }
    ],
    sql: `SELECT
    OBJECT_SCHEMA_NAME(m.object_id) AS SchemaName,
    OBJECT_NAME(m.object_id) AS ObjectName,
    o.type_desc AS ObjectType,
    o.create_date,
    o.modify_date
FROM sys.sql_modules m
INNER JOIN sys.objects o
    ON m.object_id = o.object_id
WHERE m.definition LIKE '%CustomerOrder%'
ORDER BY SchemaName, ObjectName;`,
    columnsReturned: [
      { name: 'SchemaName', description: 'Schema owner (e.g. dbo)' },
      { name: 'ObjectName', description: 'Stored procedure or view name' },
      { name: 'ObjectType', description: 'SQL_STORED_PROCEDURE, VIEW, SQL_SCALAR_FUNCTION, etc.' },
      { name: 'modify_date', description: 'Date when the object was last altered' }
    ],
    notes: [
      'Searches encrypted modules will not match because encrypted definitions appear NULL in sys.sql_modules.'
    ],
    relatedQueryIds: ['view-procedure-definition', 'find-procedures-referencing-table']
  },
  {
    id: 'view-procedure-definition',
    title: 'View Procedure Definition (sp_helptext & OBJECT_DEFINITION)',
    category: 'Stored Procedures',
    subcategory: 'Search & Definitions',
    description: 'Retrieve the complete source code of a stored procedure using sp_helptext or OBJECT_DEFINITION without opening SSMS script wizard.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['sp_helptext', 'object_definition', 'view-code', 'source'],
    whenToUse: 'Quickly inspect a stored procedure definition in query results or command line.',
    parameters: [
      {
        name: 'ProcedureName',
        placeholder: "'dbo.usp_CalculateMetrics'",
        description: 'Schema and procedure name',
        defaultValue: "'dbo.usp_CalculateMetrics'"
      }
    ],
    sql: `-- Option 1: Using sp_helptext (returns line-by-line result set)
EXEC sys.sp_helptext @objname = N'dbo.usp_CalculateMetrics';

-- Option 2: Using OBJECT_DEFINITION (returns single NVARCHAR(MAX) string)
-- SELECT OBJECT_DEFINITION(OBJECT_ID(N'dbo.usp_CalculateMetrics')) AS ProcedureSourceCode;`,
    columnsReturned: [
      { name: 'Text', description: 'Source code lines of the stored procedure' }
    ],
    relatedQueryIds: ['find-procedure-by-text', 'procedure-parameters-inspection']
  },
  {
    id: 'procedure-parameters-inspection',
    title: 'Inspect Procedure Parameters & Data Types',
    category: 'Stored Procedures',
    subcategory: 'Parameters & Dependencies',
    description: 'Query sys.parameters to inspect input and OUTPUT parameters, data types, precision, and default values.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['parameters', 'sys.parameters', 'datatypes', 'output-parameter'],
    whenToUse: 'Check expected parameter types, lengths, and nullability before calling an unfamiliar procedure.',
    parameters: [
      {
        name: 'ProcedureName',
        placeholder: "'usp_CalculateMetrics'",
        description: 'Procedure name without schema',
        defaultValue: "'usp_CalculateMetrics'"
      }
    ],
    sql: `SELECT
    p.parameter_id,
    p.name AS ParameterName,
    t.name AS DataType,
    p.max_length,
    p.precision,
    p.scale,
    p.is_output AS IsOutputParameter,
    p.has_default_value
FROM sys.parameters p
INNER JOIN sys.types t
    ON p.user_type_id = t.user_type_id
WHERE p.object_id = OBJECT_ID('usp_CalculateMetrics')
ORDER BY p.parameter_id;`,
    columnsReturned: [
      { name: 'ParameterName', description: 'Name of the parameter (e.g. @CustomerId)' },
      { name: 'DataType', description: 'SQL type (INT, NVARCHAR, DATETIME2, etc.)' },
      { name: 'IsOutputParameter', description: '1 if declared with OUTPUT keyword' }
    ],
    relatedQueryIds: ['view-procedure-definition']
  },
  {
    id: 'find-procedures-referencing-table',
    title: 'Find Procedures Referencing a Table (Dependencies)',
    category: 'Stored Procedures',
    subcategory: 'Parameters & Dependencies',
    description: 'Use sys.sql_expression_dependencies to discover all procedures and views with direct schema-bound or non-schema-bound dependencies on a table.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['dependencies', 'referencing', 'referenced', 'impact-analysis', 'sys.sql_expression_dependencies'],
    featured: true,
    whenToUse: 'Perform impact analysis before altering table columns or dropping constraints to identify affected code.',
    parameters: [
      {
        name: 'TargetTable',
        placeholder: 'dbo.Orders',
        description: 'Table name being referenced',
        defaultValue: 'dbo.Orders'
      }
    ],
    sql: `SELECT DISTINCT
    SCHEMA_NAME(o.schema_id) AS ReferencingSchema,
    o.name AS ReferencingObjectName,
    o.type_desc AS ReferencingType,
    d.referenced_database_name,
    d.referenced_schema_name,
    d.referenced_entity_name
FROM sys.sql_expression_dependencies d
INNER JOIN sys.objects o
    ON d.referencing_id = o.object_id
WHERE d.referenced_id = OBJECT_ID('dbo.Orders')
   OR d.referenced_entity_name = 'Orders'
ORDER BY ReferencingSchema, ReferencingObjectName;`,
    columnsReturned: [
      { name: 'ReferencingSchema', description: 'Schema of the dependent object' },
      { name: 'ReferencingObjectName', description: 'Name of the stored procedure or view depending on the table' },
      { name: 'ReferencingType', description: 'SQL_STORED_PROCEDURE, VIEW, etc.' }
    ],
    notes: [
      'Also catches cross-database dependencies if references were registered.',
      'For dynamic SQL references, check sys.sql_modules since expression dependencies only catch static references.'
    ],
    relatedQueryIds: ['find-procedure-by-text']
  },
  {
    id: 'procedure-error-handling-template',
    title: 'Production Stored Procedure TRY/CATCH & Error Handling',
    category: 'Stored Procedures',
    subcategory: 'Error Handling',
    description: 'Enterprise standard robust TRY/CATCH template with transaction rollback checking (XACT_STATE), detailed error logging, and THROW.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['try_catch', 'error_handling', 'throw', 'xact_state', 'standard', 'template'],
    featured: true,
    whenToUse: 'Use as the foundational boilerplate for any new stored procedure that performs data mutations.',
    sql: `CREATE OR ALTER PROCEDURE dbo.usp_TemplateProcedure
    @Parameter1 INT,
    @Parameter2 NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Automatically rolls back transaction on fatal errors

    BEGIN TRY
        BEGIN TRANSACTION;

        -- =============================================
        -- Execute business logic here
        -- =============================================
        -- UPDATE dbo.MyTable SET Column1 = @Parameter2 WHERE Id = @Parameter1;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        -- Check if an uncommittable or active transaction is still open
        IF XACT_STATE() <> 0
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        -- Capture diagnostic error context
        DECLARE 
            @ErrorNumber INT = ERROR_NUMBER(),
            @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE(),
            @ErrorSeverity INT = ERROR_SEVERITY(),
            @ErrorState INT = ERROR_STATE(),
            @ErrorLine INT = ERROR_LINE(),
            @ErrorProcedure NVARCHAR(200) = ISNULL(ERROR_PROCEDURE(), 'Ad-hoc Batch');

        -- Optional: Log error details to team log table
        -- INSERT INTO dbo.AppErrorLog (ErrorNumber, ErrorMessage, ErrorSeverity, ErrorLine, ErrorProcedure, LogDate)
        -- VALUES (@ErrorNumber, @ErrorMessage, @ErrorSeverity, @ErrorLine, @ErrorProcedure, SYSUTCDATETIME());

        -- Re-throw original error to the calling client
        THROW;
    END CATCH;
END;`,
    columnsReturned: [
      { name: 'ErrorNumber', description: 'SQL Server error code' },
      { name: 'ErrorMessage', description: 'Descriptive error message string' },
      { name: 'ErrorLine', description: 'Line number in procedure where failure occurred' },
      { name: 'ErrorProcedure', description: 'Procedure name where failure occurred' }
    ],
    notes: [
      'Always prefer THROW over RAISERROR in modern T-SQL: THROW preserves the true original line number and error severity.',
      'SET XACT_ABORT ON ensures transaction cleanup even if client terminates connection abruptly.'
    ],
    relatedQueryIds: ['transaction-debugging-safely', 'debugging-output-techniques']
  },
  {
    id: 'debugging-output-techniques',
    title: 'Debugging Output: PRINT, RAISERROR WITH NOWAIT, and SELECT',
    category: 'Stored Procedures',
    subcategory: 'Error Handling',
    description: 'Compare debugging output techniques for stored procedures. Learn why RAISERROR WITH NOWAIT immediately flushes buffers unlike PRINT.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['print', 'raiserror', 'nowait', 'debugging', 'buffer-flush', 'messages'],
    whenToUse: 'When instrumenting long-running loops or multistep ETL stored procedures to monitor progress in real time.',
    sql: `-- 1. STANDARD PRINT (Caveat: Output is buffered and may NOT display until the batch finishes!)
PRINT 'Step 1: Starting customer processing at ' + CONVERT(VARCHAR(30), SYSDATETIME(), 121);

-- 2. RAISERROR WITH NOWAIT (Instantly flushes output buffer to SSMS Messages tab without delay)
RAISERROR('Step 2: Processing batch... Rows processed: %d', 0, 1, @@ROWCOUNT) WITH NOWAIT;

-- 3. Formatted timestamp log helper:
DECLARE @Msg NVARCHAR(500) = FORMATMESSAGE('[%s] Completed step 3 successfully.', CONVERT(VARCHAR(30), SYSDATETIME(), 121));
RAISERROR(@Msg, 0, 1) WITH NOWAIT;`,
    notes: [
      'Severity 0 to 10 in RAISERROR are informational messages and do NOT trigger CATCH blocks.',
      'WITH NOWAIT bypasses the network TDS output buffer, sending the string to the client immediately.'
    ],
    relatedQueryIds: ['procedure-error-handling-template', 'transaction-debugging-safely']
  },
  {
    id: 'transaction-debugging-safely',
    title: 'Transaction Debugging: @@TRANCOUNT & XACT_STATE()',
    category: 'Stored Procedures',
    subcategory: 'Transaction Debugging',
    description: 'Diagnose orphaned transactions, open transaction counts, and uncommittable zombie transactions using @@TRANCOUNT and XACT_STATE().',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['transactions', '@@trancount', 'xact_state', 'rollback', 'uncommittable'],
    whenToUse: 'When debugging procedures that throw transaction nesting errors or when troubleshooting "Transaction count after EXECUTE indicates a mismatching number".',
    sql: `-- Check current session transaction state
SELECT
    @@TRANCOUNT AS OpenTransactionCount,
    XACT_STATE() AS TransactionState,
    CASE XACT_STATE()
        WHEN 1  THEN 'Active, Committable Transaction'
        WHEN 0  THEN 'No Active Transaction'
        WHEN -1 THEN 'Uncommittable Transaction (Must ROLLBACK, cannot COMMIT)'
    END AS TransactionDescription;

-- Safe rollback check pattern:
IF @@TRANCOUNT > 0
BEGIN
    PRINT 'Rolling back remaining open transaction...';
    ROLLBACK TRANSACTION;
END;`,
    columnsReturned: [
      { name: 'OpenTransactionCount', description: 'Nesting depth of BEGIN TRAN statements' },
      { name: 'TransactionState', description: '1 = Committable, 0 = None, -1 = Uncommittable error state' }
    ],
    warnings: [
      'Executing COMMIT when @@TRANCOUNT > 1 only decrements @@TRANCOUNT by 1. Only the outermost COMMIT writes to disk.',
      'Executing ROLLBACK when @@TRANCOUNT > 1 rolls back the entire transaction stack down to 0, regardless of nesting.'
    ],
    relatedQueryIds: ['procedure-error-handling-template']
  },
  {
    id: 'procedure-execution-stats',
    title: 'Stored Procedure Execution Stats & Average Duration',
    category: 'Stored Procedures',
    subcategory: 'Parameters & Dependencies',
    description: 'Inspect execution counts, total/average CPU, and elapsed duration for stored procedures cached in sys.dm_exec_procedure_stats.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['procedure-stats', 'execution-count', 'elapsed-time', 'tuning', 'sys.dm_exec_procedure_stats'],
    whenToUse: 'Identify which procedures account for the bulk of database execution workload.',
    sql: `SELECT TOP 25
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    o.name AS ProcedureName,
    ps.execution_count,
    (ps.total_elapsed_time / 1000) AS total_elapsed_ms,
    (ps.total_elapsed_time / ps.execution_count) / 1000 AS avg_elapsed_ms,
    (ps.total_worker_time / ps.execution_count) / 1000 AS avg_cpu_ms,
    ps.total_logical_reads / ps.execution_count AS avg_logical_reads,
    ps.last_execution_time
FROM sys.dm_exec_procedure_stats ps
INNER JOIN sys.objects o
    ON ps.object_id = o.object_id
WHERE ps.database_id = DB_ID()
ORDER BY ps.total_elapsed_time DESC;`,
    columnsReturned: [
      { name: 'ProcedureName', description: 'Stored procedure name' },
      { name: 'execution_count', description: 'Total executions since last restart/recompile' },
      { name: 'avg_elapsed_ms', description: 'Average total duration in milliseconds' },
      { name: 'avg_logical_reads', description: 'Average 8KB pages read per run' }
    ],
    relatedQueryIds: ['find-procedure-by-text', 'cpu-intensive-queries']
  },
  {
    id: 'find-broken-views-and-procedures',
    title: 'Find Broken Views & Procedures (sp_refreshsqlmodule)',
    category: 'Stored Procedures',
    subcategory: 'Search & Definitions',
    description: 'Loops through all views in the database calling sp_refreshsqlmodule to catch metadata drift and missing column errors.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['sp_refreshsqlmodule', 'broken-views', 'schema-drift', 'metadata'],
    whenToUse: 'After altering table schemas or renaming columns to verify that dependent views still compile.',
    sql: `DECLARE @ViewName NVARCHAR(261);
DECLARE @ErrorCount INT = 0;

DECLARE view_cursor CURSOR LOCAL FAST_FORWARD FOR
SELECT QUOTENAME(s.name) + '.' + QUOTENAME(v.name)
FROM sys.views v
INNER JOIN sys.schemas s ON v.schema_id = s.schema_id
WHERE v.is_ms_shipped = 0;

OPEN view_cursor;
FETCH NEXT FROM view_cursor INTO @ViewName;

WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY
        EXEC sys.sp_refreshsqlmodule @name = @ViewName;
    END TRY
    BEGIN CATCH
        SET @ErrorCount += 1;
        PRINT '❌ BROKEN VIEW DETECTED: ' + @ViewName + ' — Error: ' + ERROR_MESSAGE();
    END CATCH;

    FETCH NEXT FROM view_cursor INTO @ViewName;
END;

CLOSE view_cursor;
DEALLOCATE view_cursor;

PRINT 'Scan complete. Total broken objects found: ' + CAST(@ErrorCount AS VARCHAR(10));`,
    relatedQueryIds: ['find-procedures-referencing-table']
  },
  {
    id: 'sp-header-template',
    title: 'Official Stored Procedure Header & Modification Tracking',
    category: 'Stored Procedures',
    subcategory: 'Search & Definitions',
    description: 'Mandatory team stored procedure documentation header. Includes author, creation date, script overview, and modification tracking log without reserved keywords.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['header', 'template', 'author', 'modification-log', 'guidelines'],
    featured: true,
    whenToUse: 'Mandatory standard template for every new or altered stored procedure in the project.',
    sql: `-----================================================================= 
---- Author            : <Developer Name>
---- Date              : 01-01-2024
---- Script Description: <Brief summary of what this procedure achieves>
-----=================================================================
---- Modification Log:
---- Modified by <Name> On <dd-MMM-yyyy> for {fixing <issue>} / {adding <feature>}
-----=================================================================

CREATE OR ALTER PROCEDURE dbo.usp_TemplateProcedure
    @FromDate DATE,
    @ToDate DATE,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Standard date range handling:
    DECLARE @ToDateEND DATE = DATEADD(DAY, 1, @ToDate);

    SELECT 
        c.ConsumerId,
        c.ConsumerName,
        c.CreatedDate
    FROM dbo.M_Consumer c(NOLOCK)
    WHERE c.CreatedDate >= @FromDate 
      AND c.CreatedDate <  @ToDateEND
      AND c.IsActive = @IsActive;
END;`,
    notes: [
      'Avoid using terms like "Create/Created" or "Alter/Altered" directly in comments as they can conflict with automated deployment script find-and-replace routines.',
      'Always use "usp_" as the procedure prefix.'
    ],
    relatedQueryIds: ['procedure-error-handling-template', 't-job-error-logging']
  },
  {
    id: 't-job-error-logging',
    title: 'Batch & ETL Error Logging with T_Job_Error Table',
    category: 'Stored Procedures',
    subcategory: 'Error Handling',
    description: 'Log runtime errors directly into [mis_main].dbo.t_job_error within catch blocks, placing RAISERROR WITH NOWAIT at the end of execution.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['t_job_error', 'error-logging', 'catch', 'raiserror', 'nowait', 'etl'],
    whenToUse: 'Mandatory in all data movement, aggregation, and nightly ETL stored procedures.',
    sql: `BEGIN TRY
    -- =============================================
    -- Execute Batch / Aggregation Logic
    -- =============================================
    PRINT 'Starting aggregation batch...';

END TRY
BEGIN CATCH
    -- 1. Capture error details
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrState INT = ERROR_STATE();

    -- 2. Insert into central team error logging table
    INSERT INTO [mis_main].dbo.t_job_error (dbname, job_name, error) 
    VALUES (DB_NAME(), OBJECT_NAME(@@PROCID), @ErrMsg);

    -- 3. Halt execution with RAISERROR placed at the END of catch block
    RAISERROR(@ErrMsg, 16, 1) WITH NOWAIT;
END CATCH;`,
    notes: [
      'Placing RAISERROR at the END of the catch block ensures the INSERT into t_job_error succeeds before execution is halted.'
    ],
    relatedQueryIds: ['sp-header-template', 'procedure-error-handling-template']
  },
  {
    id: 'dynamic-org-hierarchy-string-agg',
    title: 'Dynamic Org Hierarchy Columns via STRING_AGG (@ADDORGVAR)',
    category: 'Stored Procedures',
    subcategory: 'Parameters & Dependencies',
    description: 'High-performance set-based aggregation using STRING_AGG to construct dynamic report hierarchy columns from M_Organisation_Hierarchy, replacing slow WHILE loops.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2019+',
    tags: ['string_agg', 'org-hierarchy', 'addorgvar', 'm_organisation_hierarchy', 'dynamic-sql'],
    whenToUse: 'In report stored procedures requiring dynamic organization hierarchy level columns.',
    sql: `DECLARE @OrgMaxId INT;
DECLARE @ADDORGVAR NVARCHAR(MAX);

-- Efficient set-based hierarchy column generation (replaces legacy WHILE loop)
SELECT 
    @OrgMaxId = MAX(OrganisationHierarchy_TblRefID),
    @ADDORGVAR = STRING_AGG('RO.OrgName' + CAST(OrganisationHierarchy_TblRefID AS NVARCHAR(2)) + ' [' + OrganisationHierarchy_Name + '],', '')
FROM [MDMS_MASTER].[dbo].M_Organisation_Hierarchy(NOLOCK) 
WHERE OrganisationHierarchy_TblRefID > 1;

PRINT 'Generated Org Variables: ' + ISNULL(@ADDORGVAR, '');`,
    relatedQueryIds: ['string-split-and-aggregate']
  }
];


