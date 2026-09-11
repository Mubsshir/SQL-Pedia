export interface SpBoilerplate {
  id: string;
  name: string;
  category: 'Report' | 'ETL / Data Movement' | 'Transactional' | 'Staging / Ingestion';
  description: string;
  database: string;
  authorDefault: string;
  defaultProcName: string;
  tags: string[];
  features: string[];
  templateGenerator: (params: {
    procName: string;
    author: string;
    date: string;
    description: string;
    database: string;
    payloadId?: string;
  }) => string;
}

export const SP_BOILERPLATES: SpBoilerplate[] = [
  {
    id: 'report-feeder-coverage',
    name: 'Report Stored Procedure (MIS / Feeder / Hierarchy)',
    category: 'Report',
    description: 'Official Company standard template for MIS reports, Feeder IP/LS/Event data coverage, Office/HES hierarchy filtering, and pagination.',
    database: 'mis',
    authorDefault: 'Mubasshir Khan',
    defaultProcName: 'usp_rep_feeder_comm_datacoverage_ip_ls_event_dtl',
    tags: ['Report', 'MIS', 'Hierarchy', 'Pagination', 'Date Range', 'Feeder IP/LS'],
    features: [
      'Hierarchy & Office Login Parameterization (@LoginHierarchyID, @LoginOfficeID, @LoginHESID, @RoleID)',
      'Built-in Pagination controls (@viewcount, @offset, @btntype)',
      'Org vs Network selector (@OrgOrNetwork, @HierarchyID, @OrgNetID)',
      'DTR Rating & Type categorization (@DTRRatingID, @DTRTypeID)',
      'Open-ended Date Filter range calculation (@FromDateSTART, @ToDateEND)',
      'Dynamic SQL & Filter builder variable declarations',
      'Adheres to SET NOCOUNT ON and Company DB Guideline #1'
    ],
    templateGenerator: ({ procName, author, date, description, database }) => `USE [${database || 'mis'}]
GO
/****** Object:  StoredProcedure [dbo].[${procName || 'usp_rep_name'}]    Script Date: ${date} ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ============================================= 
-- Author:      ${author || 'Mubasshir Khan'}
-- Date:        ${date || '2024-Apr-02'}
-- Description: ${description || 'Feeder IP,LS,Event Data coverage report details'}
-- Reference:   Company MIS / MDMS Standard Reporting Framework
-- ============================================= 
CREATE OR ALTER PROCEDURE [dbo].[${procName || 'usp_rep_name'}] 
    @ID NVARCHAR(MAX) = '499',
    @LoginHierarchyID INT = 1,
    @LoginOfficeID NVARCHAR(1000) = '',
    @LoginHESID NVARCHAR(1000) = 1,
    @RoleID INT = 1,
    @viewcount NVARCHAR(15) = '100',
    @offset INT = 0,
    @btntype INT = 1,
    @LoginRefID INT = 1,
    -----------
    @OrgOrNetwork NVARCHAR(1) = 'O',
    @HierarchyID INT = 1,
    @OrgNetID BIGINT = 1,
    @DTRRatingID INT = 3,
    @DTRTypeID INT = 4,
    @FromDate DATE = '2025-10-28',
    @ToDate DATE = '2025-10-28',
    @MSN NVARCHAR(32) = '',
    @param1 INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Calculated Date Bounds (Guideline: avoid per-row function calls in WHERE clauses)
    DECLARE @FromDateSTART DATETIME, @ToDateEND DATETIME;
    SELECT @FromDateSTART = DATEADD(DAY, -1, @FromDate), 
           @ToDateEND = DATEADD(DAY, 1, @ToDate);

    -- Standard Dynamic SQL & Hierarchy Variable Declarations
    DECLARE @SQLString NVARCHAR(MAX) = '',
            @ADDORGVAR NVARCHAR(MAX) = '',
            @ADDNETVAR NVARCHAR(MAX) = '',
            @ADDQUERY NVARCHAR(MAX) = '',
            @OrgName NVARCHAR(MAX) = '',
            @NetName NVARCHAR(MAX) = '',
            @ErrMsg NVARCHAR(MAX) = '',
            @OrgMaxId INT = 0,
            @NetMaxId INT = 0,
            @MeterLookup_TblRefID INT = 0,
            @MasterColumnID INT = 0,
            @MasterColumns NVARCHAR(MAX) = '',
            @Table NVARCHAR(50) = '';

    /* -------------------------------------------------------------
       1. ORG / NETWORK HIERARCHY RESOLUTION
       ------------------------------------------------------------- */
    IF @OrgOrNetwork = 'O'
    BEGIN
        SET @ADDORGVAR = ' AND HierarchyID = ' + CAST(@HierarchyID AS NVARCHAR(10));
    END
    ELSE
    BEGIN
        SET @ADDNETVAR = ' AND OrgNetID = ' + CAST(@OrgNetID AS NVARCHAR(20));
    END

    /* -------------------------------------------------------------
       2. CORE DATA RETRIEVAL (Adhere to (NOLOCK) on high-volume tables)
       ------------------------------------------------------------- */
    -- Example query logic:
    SELECT 1;

END
GO`
  },
  {
    id: 'import-data-movement-payload',
    name: 'Import / Data Movement SP (mdms_stg / m_max_movedata)',
    category: 'ETL / Data Movement',
    description: 'Production-grade ETL movement procedure between mdms_stg and mis/production with payload run tracking, IDENT_CURRENT batching, and t_job_error logging.',
    database: 'mdms_stg',
    authorDefault: 'Mubasshir Khan',
    defaultProcName: 'usp_import_monthly_to_mobileapp',
    tags: ['ETL', 'Data Movement', 'm_max_movedata', 't_job_error', 'TRY CATCH', 'mdms_stg'],
    features: [
      'Atomic job start tracking in mdms_stg.dbo.m_max_movedata',
      'Identity watermark evaluation using IDENT_CURRENT and @minid vs @maxid',
      'Resilient TRY...CATCH block logging directly into mdms_stg.dbo.t_job_error',
      'Automatic lasterror timestamp update upon failure',
      'RAISERROR with NOWAIT for instant SQL Agent alert propagation',
      'Complies with Company DB Guideline #12 (Error Logging) and #15 (Execution Tracking)'
    ],
    templateGenerator: ({ procName, author, date, description, database, payloadId }) => `USE [${database || 'mdms_stg'}]
GO
/****** Object:  StoredProcedure [dbo].[${procName || 'usp_import_spname'}]    Script Date: ${date} ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      ${author || 'Mubasshir Khan'}
-- Create date: ${date || '2024-Nov-20'}
-- Description: ${description || 'Movement of monthly to T_Notification_MobileApp'}
-- Pattern:     Company Payload Data Movement Engine with Error Auditing
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[${procName || 'usp_import_spname'}]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RowCnt INT, 
            @MaxID BIGINT, 
            @MinID BIGINT, 
            @ErrMsg NVARCHAR(MAX),
            @PayloadID INT = ${payloadId || '100'};

    BEGIN TRY
        -- 1. Mark start of job run in payload control table
        UPDATE mdms_stg.dbo.[m_max_movedata] 
        SET start_jobrun_dt = GETDATE() 
        WHERE payload_id = @PayloadID;

        -- 2. Fetch current watermark pointer
        SELECT @minid = dataid 
        FROM mdms_stg.dbo.[m_max_movedata] (NOLOCK) 
        WHERE payload_id = @PayloadID;

        -- 3. Retrieve latest identity watermark from source table
        SELECT @maxid = IDENT_CURRENT('mis.dbo.t_notification_monthly');

        -- 4. Check if new records exist for movement
        IF @MaxID > @MinID
        BEGIN
            SET @RowCnt = 0;

            /* =================================================================
               INSERT BATCH MOVEMENT LOGIC HERE
               e.g.:
               INSERT INTO mis.dbo.T_Notification_MobileApp (
                   NotificationID,
                   MeterNo,
                   Message,
                   CreatedDate
               )
               SELECT 
                   ID,
                   MSN,
                   NotifyText,
                   GETDATE()
               FROM mis.dbo.t_notification_monthly (NOLOCK)
               WHERE ID > @MinID AND ID <= @MaxID;

               SET @RowCnt = @@ROWCOUNT;
               ================================================================= */

            -- 5. Advance watermark pointer and stamp completion time
            UPDATE mdms_stg.dbo.[m_max_movedata] 
            SET dataid = @MaxID,
                end_jobrun_dt = GETDATE() 
            WHERE payload_id = @PayloadID;

            SELECT 1 AS StatusResult, @RowCnt AS RowsMoved;
        END
        ELSE
        BEGIN
            -- No new data found; mark healthy idle completion
            UPDATE mdms_stg.dbo.[m_max_movedata] 
            SET end_jobrun_dt = GETDATE() 
            WHERE payload_id = @PayloadID;

            SELECT 0 AS StatusResult, 0 AS RowsMoved;
        END
    END TRY
    BEGIN CATCH
        -- 6. Capture error timestamp on control table
        UPDATE mdms_stg.dbo.[m_max_movedata] 
        SET lasterror = GETDATE() 
        WHERE payload_id = @PayloadID;

        -- 7. Extract detailed error string
        SELECT @ErrMsg = ERROR_MESSAGE() + ' (Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';
        
        -- 8. Insert incident into centralized job error log
        INSERT INTO mdms_stg.dbo.[t_job_error] (
            dbname, 
            job_name, 
            error
        )
        VALUES (
            DB_NAME(), 
            OBJECT_NAME(@@PROCID), 
            @ErrMsg
        );

        -- 9. Re-throw to inform calling Agent Job / orchestrator immediately
        RAISERROR(@ErrMsg, 16, 1) WITH NOWAIT;
    END CATCH
END
GO`
  },
  {
    id: 'transactional-business-logic',
    name: 'Transactional SP with Safe Rollback (usp_txn_*)',
    category: 'Transactional',
    description: 'Enterprise transactional stored procedure with atomic commit/rollback, XACT_STATE() evaluation, nested transaction safety, and error logging.',
    database: 'mis',
    authorDefault: 'Company DBA Team',
    defaultProcName: 'usp_txn_process_meter_commissioning',
    tags: ['Transactions', 'BEGIN TRAN', 'XACT_STATE', 'Atomic', 'Rollback', 'TRY CATCH'],
    features: [
      'Safe transaction nesting check with @@TRANCOUNT and SAVE TRANSACTION',
      'XACT_STATE() = -1 uncommittable transaction detection',
      'Standardized output parameters (@ReturnStatus, @ErrorMessage)',
      'Guideline #4 compliance: explicit column lists, no SELECT *',
      'Automatic t_job_error audit logging on failure'
    ],
    templateGenerator: ({ procName, author, date, description, database }) => `USE [${database || 'mis'}]
GO
/****** Object:  StoredProcedure [dbo].[${procName || 'usp_txn_name'}]    Script Date: ${date} ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      ${author || 'Company DBA Team'}
-- Create date: ${date || '2026-Sep-11'}
-- Description: ${description || 'Transactional business logic with atomic rollback and validation'}
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[${procName || 'usp_txn_name'}]
    @MSN NVARCHAR(32),
    @HierarchyID INT,
    @UpdatedBy NVARCHAR(100),
    @ReturnStatus INT = 0 OUTPUT,
    @ErrorMessage NVARCHAR(MAX) = '' OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- Terminates and rolls back on serious batch-level errors

    DECLARE @TranStarted BIT = 0;
    DECLARE @InitialTranCount INT = @@TRANCOUNT;

    BEGIN TRY
        -- Start transaction if one does not already exist
        IF @InitialTranCount = 0
        BEGIN
            BEGIN TRANSACTION;
            SET @TranStarted = 1;
        END
        ELSE
        BEGIN
            -- Nested transaction savepoint
            SAVE TRANSACTION NestedTxnPoint;
        END

        /* -------------------------------------------------------------
           STEP 1: VALIDATION CHECKS
           ------------------------------------------------------------- */
        IF @MSN IS NULL OR LEN(LTRIM(RTRIM(@MSN))) = 0
        BEGIN
            RAISERROR('Validation Failed: MSN cannot be empty or null.', 16, 1);
        END

        /* -------------------------------------------------------------
           STEP 2: BUSINESS ATOMIC DATA MODIFICATIONS
           ------------------------------------------------------------- */
        -- Place core INSERT / UPDATE / DELETE statements here

        -- Commit if this procedure started the transaction
        IF @TranStarted = 1
        BEGIN
            COMMIT TRANSACTION;
        END

        SET @ReturnStatus = 1;
        SET @ErrorMessage = 'SUCCESS';
    END TRY
    BEGIN CATCH
        -- Roll back safely depending on XACT_STATE()
        IF XACT_STATE() = -1
        BEGIN
            -- Transaction is doomed; full rollback is required
            ROLLBACK TRANSACTION;
        END
        ELSE IF XACT_STATE() = 1
        BEGIN
            IF @TranStarted = 1
                ROLLBACK TRANSACTION;
            ELSE
                ROLLBACK TRANSACTION NestedTxnPoint;
        END

        SET @ReturnStatus = -1;
        SET @ErrorMessage = ERROR_MESSAGE() + ' (Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';

        -- Audit to centralized error repository
        IF OBJECT_ID('mdms_stg.dbo.t_job_error', 'U') IS NOT NULL
        BEGIN
            INSERT INTO mdms_stg.dbo.t_job_error (dbname, job_name, error)
            VALUES (DB_NAME(), OBJECT_NAME(@@PROCID), @ErrorMessage);
        END

        RAISERROR(@ErrorMessage, 16, 1) WITH NOWAIT;
    END CATCH
END
GO`
  },
  {
    id: 'staging-bulk-merge',
    name: 'Staging Bulk Merge / Ingestion SP (usp_stg_*)',
    category: 'Staging / Ingestion',
    description: 'High-throughput staging ingestion procedure using batch staging tables, deduplication CTEs, and MERGE / UPSERT into core partitioned tables.',
    database: 'mdms_stg',
    authorDefault: 'Company Data Engineering',
    defaultProcName: 'usp_stg_merge_raw_meter_intervals',
    tags: ['Staging', 'Bulk Ingestion', 'Deduplication', 'Merge', 'mdms_stg'],
    features: [
      'Deduplication via ROW_NUMBER() CTE before target merge',
      'Batch-optimized UPSERT (Guideline #14: process in batches, not single massive transactions)',
      'Direct index seek friendly joins on MSN and IntervalTimestamp',
      'Comprehensive duration and row count diagnostic output'
    ],
    templateGenerator: ({ procName, author, date, description, database }) => `USE [${database || 'mdms_stg'}]
GO
/****** Object:  StoredProcedure [dbo].[${procName || 'usp_stg_merge_name'}]    Script Date: ${date} ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:      ${author || 'Company Data Engineering'}
-- Create date: ${date || '2026-Sep-11'}
-- Description: ${description || 'Batch upsert from staging queue into core partition-aligned table'}
-- =============================================
CREATE OR ALTER PROCEDURE [dbo].[${procName || 'usp_stg_merge_name'}]
    @BatchSize INT = 50000,
    @RowsProcessed INT = 0 OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StartTime DATETIME = GETDATE(),
            @EndTime DATETIME,
            @ErrMsg NVARCHAR(MAX);

    BEGIN TRY
        -- 1. Create indexed working table for current batch
        CREATE TABLE #BatchStaging (
            MSN NVARCHAR(32) NOT NULL,
            ReadDateTime DATETIME NOT NULL,
            ActiveEnergy_kWh DECIMAL(18, 4),
            RowRank INT NOT NULL,
            PRIMARY KEY CLUSTERED (MSN, ReadDateTime)
        );

        -- 2. Deduplicate raw data from staging buffer
        WITH RankedData AS (
            SELECT 
                MSN,
                ReadDateTime,
                ActiveEnergy_kWh,
                ROW_NUMBER() OVER (PARTITION BY MSN, ReadDateTime ORDER BY StagingID DESC) AS rn
            FROM mdms_stg.dbo.t_stg_meter_reads (NOLOCK)
            WHERE IsProcessed = 0
        )
        INSERT INTO #BatchStaging (MSN, ReadDateTime, ActiveEnergy_kWh, RowRank)
        SELECT TOP (@BatchSize) MSN, ReadDateTime, ActiveEnergy_kWh, rn
        FROM RankedData
        WHERE rn = 1;

        -- 3. Atomic Merge / Upsert into Destination
        -- (Replace with target table e.g. mis.dbo.T_Meter_Interval_Data)
        /*
        MERGE mis.dbo.T_Meter_Interval_Data WITH (HOLDLOCK) AS target
        USING #BatchStaging AS src
        ON (target.MSN = src.MSN AND target.ReadDateTime = src.ReadDateTime)
        WHEN MATCHED AND target.ActiveEnergy_kWh <> src.ActiveEnergy_kWh THEN
            UPDATE SET target.ActiveEnergy_kWh = src.ActiveEnergy_kWh,
                       target.UpdatedDate = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (MSN, ReadDateTime, ActiveEnergy_kWh, CreatedDate)
            VALUES (src.MSN, src.ReadDateTime, src.ActiveEnergy_kWh, GETDATE());
        */

        SET @RowsProcessed = @@ROWCOUNT;

        -- 4. Mark staging rows as completed
        UPDATE s
        SET s.IsProcessed = 1,
            s.ProcessedDate = GETDATE()
        FROM mdms_stg.dbo.t_stg_meter_reads s
        INNER JOIN #BatchStaging b ON s.MSN = b.MSN AND s.ReadDateTime = b.ReadDateTime;

        DROP TABLE #BatchStaging;

        SET @EndTime = GETDATE();
        SELECT @RowsProcessed AS ProcessedCount, 
               DATEDIFF(MILLISECOND, @StartTime, @EndTime) AS DurationMS;

    END TRY
    BEGIN CATCH
        IF OBJECT_ID('tempdb..#BatchStaging') IS NOT NULL DROP TABLE #BatchStaging;

        SELECT @ErrMsg = ERROR_MESSAGE() + ' (Line: ' + CAST(ERROR_LINE() AS NVARCHAR(10)) + ')';

        INSERT INTO mdms_stg.dbo.t_job_error (dbname, job_name, error)
        VALUES (DB_NAME(), OBJECT_NAME(@@PROCID), @ErrMsg);

        RAISERROR(@ErrMsg, 16, 1) WITH NOWAIT;
    END CATCH
END
GO`
  }
];
