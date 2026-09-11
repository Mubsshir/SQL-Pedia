import { QuerySnippet } from '../../types';

export const databaseAdminQueries: QuerySnippet[] = [
  {
    id: 'database-sizes-and-free-space',
    title: 'Database File Sizes & Available Free Space',
    category: 'Database',
    subcategory: 'Database Sizing',
    description: 'Report data (.mdf/.ndf) and log (.ldf) file sizes, allocated disk space, free space in MB and percentage.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['database-size', 'data-files', 'log-files', 'free-space', 'sys.database_files'],
    featured: true,
    whenToUse: 'Capacity planning, disk alerts, and verifying free space within database files.',
    sql: `SELECT
    df.name AS LogicalFileName,
    df.type_desc AS FileType,
    df.physical_name AS PhysicalFilePath,
    CAST(ROUND((df.size * 8.0) / 1024, 2) AS DECIMAL(18, 2)) AS TotalSizeMB,
    CAST(ROUND((FILEPROPERTY(df.name, 'SpaceUsed') * 8.0) / 1024, 2) AS DECIMAL(18, 2)) AS UsedSpaceMB,
    CAST(ROUND(((df.size - FILEPROPERTY(df.name, 'SpaceUsed')) * 8.0) / 1024, 2) AS DECIMAL(18, 2)) AS FreeSpaceMB,
    CAST(ROUND(((df.size - FILEPROPERTY(df.name, 'SpaceUsed')) * 1.0 / df.size) * 100, 2) AS DECIMAL(5, 2)) AS FreeSpacePercent
FROM sys.database_files df
ORDER BY df.type, df.name;`,
    columnsReturned: [
      { name: 'LogicalFileName', description: 'Logical name used in ALTER DATABASE commands' },
      { name: 'FileType', description: 'ROWS (Data) or LOG (Transaction Log)' },
      { name: 'TotalSizeMB', description: 'Current allocated file size on disk' },
      { name: 'UsedSpaceMB', description: 'Actual storage used by data/log records' },
      { name: 'FreeSpaceMB', description: 'Unused space inside the file before auto-growth' }
    ],
    relatedQueryIds: ['file-autogrowth-audit', 'vlf-count-transaction-log']
  },
  {
    id: 'file-autogrowth-audit',
    title: 'File Auto-Growth Settings Audit (Detect % Growth Hazard)',
    category: 'Database',
    subcategory: 'File & Log Management',
    description: 'Inspect auto-growth configuration. Detect dangerous percent-based growth (e.g. 10%) that causes severe file pauses as files scale.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['autogrowth', 'growth', 'best-practices', 'sys.master_files'],
    whenToUse: 'Perform instance health checks to ensure fixed-size growth (e.g. 512MB or 1024MB) is configured instead of percentage growth.',
    sql: `SELECT
    DB_NAME(mf.database_id) AS DatabaseName,
    mf.name AS LogicalFileName,
    mf.type_desc AS FileType,
    CAST((mf.size * 8.0) / 1024 AS DECIMAL(18, 2)) AS CurrentSizeMB,
    CASE mf.is_percent_growth
        WHEN 1 THEN CAST(mf.growth AS VARCHAR(10)) + '%'
        ELSE CAST((mf.growth * 8.0) / 1024 AS VARCHAR(10)) + ' MB'
    END AS GrowthSetting,
    mf.is_percent_growth,
    CASE 
        WHEN mf.is_percent_growth = 1 
            THEN 'WARNING: Percent growth causes exponential pause times on large files. Change to fixed MB (e.g. 512MB / 1024MB).'
        WHEN mf.growth = 0
            THEN 'WARNING: Auto-growth is DISABLED.'
        ELSE 'OK (Fixed Growth)'
    END AS GrowthAssessment
FROM sys.master_files mf
WHERE mf.database_id > 4 -- Exclude system master, model, msdb, tempdb
ORDER BY DatabaseName, mf.type;`,
    notes: [
      'Percentage-based growth on a 500GB file with 10% growth forces SQL Server to allocate and zero 50GB at once, causing timeout spikes.'
    ],
    relatedQueryIds: ['database-sizes-and-free-space', 'vlf-count-transaction-log']
  },
  {
    id: 'vlf-count-transaction-log',
    title: 'Virtual Log File (VLF) Count per Database',
    category: 'Database',
    subcategory: 'File & Log Management',
    description: 'Check Virtual Log File (VLF) count in transaction logs. High VLF counts (> 1,000) degrade database recovery and startup times.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['vlf', 'transaction-log', 'sys.dm_db_log_info', 'recovery-time'],
    whenToUse: 'When database recovery or backups take abnormally long, or after frequent small transaction log growths.',
    sql: `SELECT
    d.name AS DatabaseName,
    COUNT(li.file_id) AS TotalVLFCount,
    SUM(CASE WHEN li.vlf_status = 2 THEN 1 ELSE 0 END) AS ActiveVLFCount,
    CAST(ROUND(SUM(li.vlf_size_mb), 2) AS DECIMAL(18, 2)) AS TotalLogSizeMB,
    CASE 
        WHEN COUNT(li.file_id) > 1000 
            THEN 'HIGH VLF COUNT: Consider shrinking log and resizing with larger fixed growth increments.'
        WHEN COUNT(li.file_id) > 500
            THEN 'MODERATE VLF COUNT: Monitor.'
        ELSE 'HEALTHY'
    END AS VLFStatus
FROM sys.databases d
CROSS APPLY sys.dm_db_log_info(d.database_id) li
GROUP BY d.name
ORDER BY TotalVLFCount DESC;`,
    columnsReturned: [
      { name: 'DatabaseName', description: 'Target database' },
      { name: 'TotalVLFCount', description: 'Total number of virtual log files' },
      { name: 'ActiveVLFCount', description: 'VLFs currently containing active transactions' },
      { name: 'VLFStatus', description: 'Health evaluation' }
    ],
    notes: [
      'sys.dm_db_log_info is available in SQL Server 2016 SP2 and 2017+ (replaces DBCC LOGINFO).'
    ],
    relatedQueryIds: ['database-sizes-and-free-space']
  },
  {
    id: 'last-backup-and-recovery-model',
    title: 'Last Backup Date & Recovery Model Audit',
    category: 'Database',
    subcategory: 'Backups & Maintenance',
    description: 'Verify last Full, Differential, and Transaction Log backups and recovery models across all databases.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['backups', 'recovery-model', 'disaster-recovery', 'msdb', 'rpo'],
    whenToUse: 'Daily verification of disaster recovery readiness and ensuring databases in FULL recovery have active log backups.',
    sql: `SELECT
    d.name AS DatabaseName,
    d.recovery_model_desc AS RecoveryModel,
    MAX(CASE WHEN b.type = 'D' THEN b.backup_finish_date END) AS LastFullBackup,
    MAX(CASE WHEN b.type = 'I' THEN b.backup_finish_date END) AS LastDiffBackup,
    MAX(CASE WHEN b.type = 'L' THEN b.backup_finish_date END) AS LastLogBackup,
    DATEDIFF(HOUR, MAX(CASE WHEN b.type = 'D' THEN b.backup_finish_date END), GETDATE()) AS HoursSinceLastFullBackup
FROM sys.databases d
LEFT JOIN msdb.dbo.backupset b
    ON d.name = b.database_name
WHERE d.name <> 'tempdb'
GROUP BY d.name, d.recovery_model_desc
ORDER BY HoursSinceLastFullBackup DESC;`,
    columnsReturned: [
      { name: 'DatabaseName', description: 'Database name' },
      { name: 'RecoveryModel', description: 'FULL, SIMPLE, or BULK_LOGGED' },
      { name: 'LastFullBackup', description: 'Timestamp of last complete backup' },
      { name: 'LastLogBackup', description: 'Timestamp of last log backup (must be regular for FULL recovery)' }
    ],
    notes: [
      'CRITICAL: If a database is in FULL recovery model but LastLogBackup is NULL, the transaction log will never truncate and will grow until disk space is exhausted!'
    ],
    relatedQueryIds: ['database-sizes-and-free-space']
  },
  {
    id: 'database-scoped-configs',
    title: 'Database Scoped Configurations (MAXDOP, CE, Sniffing)',
    category: 'Database',
    subcategory: 'Database Sizing',
    description: 'Inspect database-level engine knobs like MAXDOP, Cardinality Estimation version, and Parameter Sniffing behavior.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['database_scoped_configurations', 'maxdop', 'cardinality-estimation', 'parameter-sniffing'],
    whenToUse: 'Verifying consistency of database configurations after upgrading compatibility levels.',
    sql: `SELECT
    configuration_id,
    name AS ConfigurationName,
    value AS PrimaryValue,
    value_for_secondary AS SecondaryReplicaValue,
    is_value_default
FROM sys.database_scoped_configurations
ORDER BY name;`,
    notes: [
      'Allows overriding instance-wide server settings on a per-database basis without changing master sp_configure.'
    ],
    relatedQueryIds: ['database-sizes-and-free-space']
  },
  {
    id: 'check-page-corruption',
    title: 'Storage Corruption & Suspect Pages Audit',
    category: 'Database',
    subcategory: 'Backups & Maintenance',
    description: 'Inspect msdb.dbo.suspect_pages for 823/824 I/O hardware errors and corrupted 8KB data pages.',
    difficulty: 'Advanced',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['suspect_pages', 'corruption', 'error-823', 'error-824', 'storage-errors', 'msdb'],
    whenToUse: 'Hardware alerts, SAN failover events, or unexplained query termination errors.',
    sql: `SELECT
    DB_NAME(sp.database_id) AS DatabaseName,
    sp.file_id,
    sp.page_id,
    sp.event_type,
    CASE sp.event_type
        WHEN 1 THEN '823 error (Operating system CRC / Read failure) or 824 error (Bad Page Checksum)'
        WHEN 2 THEN 'Bad Checksum'
        WHEN 3 THEN 'Torn Page'
        WHEN 4 THEN 'Restored (Page was successfully repaired)'
        WHEN 5 THEN 'Repaired (DBCC repair)'
        WHEN 7 THEN 'Deallocated by DBCC'
        ELSE 'Other'
    END AS ErrorDescription,
    sp.error_count,
    sp.last_update_date
FROM msdb.dbo.suspect_pages sp
ORDER BY sp.last_update_date DESC;`,
    notes: [
      'If event_type is 1, 2, or 3, immediate DBA intervention is required: run DBCC CHECKDB to determine corruption extent and restore from clean backup.'
    ],
    relatedQueryIds: ['last-backup-and-recovery-model']
  },
  {
    id: 'counter-table-resets',
    title: 'Staging & Data Movement Counter Resets (Deployment Script)',
    category: 'Database',
    subcategory: 'Backups & Maintenance',
    description: 'Mandatory counter table reset scripts across MIS, Integration, MDMS, and SCADA staging databases before going live or running full syncs.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['counter-reset', 'data-movement', 'staging', 'deployment', 'guidelines'],
    featured: true,
    whenToUse: 'Mandatory step during new database deployment and ETL counter re-initialization.',
    sql: `-- Reset data movement counters across staging databases
UPDATE MIS_Staging.dbo.[M_Max_MoveData_MIS] SET DataCount = 0;
UPDATE Integration_Staging.dbo.M_Max_MoveData SET datacount = 0;
UPDATE MDMS_Staging.dbo.M_Max_MoveData SET datacount = 0;
UPDATE SCADADATA.dbo.M_Max_MoveData SET datacount = 0;

-- Reset ETL logging process counters:
UPDATE mdms_stg.dbo.m_etl SET processcounter = 0;
UPDATE mdms_stg.dbo.m_log_dataaggregation_2023 SET dataid = 0;
UPDATE mdms_stg.dbo.m_log_dataaggregation_2024 SET dataid = 0;`,
    notes: [
      'From team DB Guidelines Document: Step 10 of deployment checklist.'
    ],
    relatedQueryIds: ['database-sizes-and-free-space']
  },
  {
    id: 'table-nomenclature-cheat-sheet',
    title: 'Table Prefix Nomenclature Standards (M_, L_, T_, S_, R_)',
    category: 'Database',
    subcategory: 'Database Sizing',
    description: 'Official team table nomenclature standards: M for Master, L for Lookup, T for Transaction, S for Staging, and R for Report tables.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['table-naming', 'nomenclature', 'master', 'lookup', 'transaction', 'staging', 'report', 'guidelines'],
    featured: true,
    whenToUse: 'Reference for all schema design and table creation across all project databases.',
    sql: `-- ====================================================================
-- TEAM TABLE NOMENCLATURE SPECIFICATION
-- ====================================================================
-- M_ : Master Tables (e.g. M_Organisation_Hierarchy, M_HES, M_Consumer)
-- L_ : Lookup Tables (e.g. L_Network_Lookup, L_Meter_Lookup, L_Consumer_Lookup)
-- T_ : Transaction Tables (e.g. T_Consumer_Billing, T_Job_Error)
-- S_ : Staging Tables (e.g. S_RawMeterData, S_MIS_Staging)
-- R_ : Report Tables (e.g. R_Consumer_All, R_Organisation, R_Network)
-- ====================================================================

-- Master Table Example:
CREATE TABLE dbo.M_MeterType
(
    MeterTypeId INT NOT NULL CONSTRAINT PK_M_MeterType PRIMARY KEY,
    MeterTypeName VARCHAR(50) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_M_MeterType_IsActive DEFAULT (1)
);

-- Lookup Table Example:
CREATE TABLE dbo.L_Status_Lookup
(
    StatusId INT NOT NULL CONSTRAINT PK_L_Status_Lookup PRIMARY KEY,
    StatusName VARCHAR(30) NOT NULL
);`,
    relatedQueryIds: ['create-table-complete']
  }
];


