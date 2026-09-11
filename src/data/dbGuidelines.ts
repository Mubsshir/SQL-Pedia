export interface GuidelineItem {
  sno: number;
  guideline: string;
  remarks?: string;
  query?: string;
  category: 'SP Guidelines' | 'Table Guidelines' | 'New Year Activities' | 'New DB Deploy' | 'Hierarchy & Sync';
}

export interface TableAlias {
  tableName: string;
  aliasName: string;
  reference: string;
}

export const TABLE_ALIASES: TableAlias[] = [
  { tableName: 'L_Network_Lookup', aliasName: 'LNL1', reference: 'Substation instance' },
  { tableName: 'L_Network_Lookup', aliasName: 'LNL2', reference: 'Feeder instance' },
  { tableName: 'L_Network_Lookup', aliasName: 'LNL3', reference: 'DTR instance' },
  { tableName: 'L_Network_Meter_Lookup', aliasName: 'LNML', reference: 'Network Meter' },
  { tableName: 'L_Meter_Lookup', aliasName: 'LML', reference: 'Meter' },
  { tableName: 'L_Consumer_Lookup', aliasName: 'LCL', reference: 'Consumer' },
  { tableName: 'R_Consumer_All', aliasName: 'R', reference: 'Consumer Report' },
  { tableName: 'R_Organisation', aliasName: 'RO', reference: 'Organisation Report' },
  { tableName: 'R_Network', aliasName: 'RN', reference: 'Network Report' },
];

export const SP_GUIDELINES: GuidelineItem[] = [
  {
    sno: 1,
    category: 'SP Guidelines',
    guideline: "When creating a stored procedure, it is mandatory to include fundamental information such as the author's name, date of SP creation, and a descriptive overview. These essential details provide context and documentation for the procedure's purpose and functionality.",
    remarks: "Use the official template provided below. Avoid using terms such as 'Create/Created' or 'Alter/Altered' as comments, as they conflict with SQL search/replace scripts.",
    query: `-----================================================================= 
---- Author : <Author Name>
---- Date : 01-01-2024
---- Script Description : <Procedure Purpose and Overview>
-----=================================================================`
  },
  {
    sno: 2,
    category: 'SP Guidelines',
    guideline: "Every modification of the SP should be documented with the last modified date, author, and description of change for tracking purposes.",
    remarks: "Accurate identification of the most recent changes heavily relies on details in the modification header.",
    query: `---- Modified by <Name> On <dd-MMM-yyyy> for {fixing <issue>} / {adding <feature>}`
  },
  {
    sno: 3,
    category: 'SP Guidelines',
    guideline: "All stored procedure names must commence with the prefix 'usp_' for consistency and standardization across all databases.",
    remarks: "NEVER use 'sp_' (reserved for SQL Server master system stored procedures).",
    query: `CREATE OR ALTER PROCEDURE dbo.usp_GetConsumerDetails`
  },
  {
    sno: 4,
    category: 'SP Guidelines',
    guideline: "Use standard parameter names and procedure names as established across the project instead of inventing arbitrary names.",
    remarks: "Maintains coding standards and predictable API signatures across frontend, backend, and ETL jobs."
  },
  {
    sno: 5,
    category: 'SP Guidelines',
    guideline: "Include meaningful comments wherever necessary for easy understanding and long-term maintainability of database code."
  },
  {
    sno: 6,
    category: 'SP Guidelines',
    guideline: "Implement TRY-CATCH blocks and transactions for error handling in stored procedures related to data movement and CRUD operations. Error handling should be utilized exclusively in procedures associated with user interface screens and data mutations, and NOT in procedures designed purely for generating reports or aggregations.",
    remarks: "Avoid transaction overhead and lock retention in read-only Report and Aggregation procedures."
  },
  {
    sno: 7,
    category: 'SP Guidelines',
    guideline: "Ensure that all stored procedures do not contain extraneous or trailing spaces, especially in dynamic SQL.",
    remarks: "Eliminating redundant spaces improves readability, reduces character length in dynamic queries, and avoids complications with sp_helptext line wrapping."
  },
  {
    sno: 8,
    category: 'SP Guidelines',
    guideline: "Utilize the (NOLOCK) hint within report SPs for enhanced data retrieval efficiency in multi-user environments. Avoid using the verbose WITH (NOLOCK) syntax which adds unnecessary characters.",
    remarks: "Recommended: FROM dbo.Table(NOLOCK) instead of FROM dbo.Table WITH (NOLOCK). Use judiciously in reports.",
    query: `SELECT * FROM dbo.R_Consumer_All(NOLOCK)`
  },
  {
    sno: 9,
    category: 'SP Guidelines',
    guideline: "Ensure aggregation and data movement stored procedures integrate with the T_Job_Error table to effectively capture and log runtime errors within CATCH blocks.",
    remarks: "Centralizes error tracking for batch jobs and nocturnal ETL runs.",
    query: `INSERT INTO [mis_main].dbo.t_job_error(dbname, job_name, error) 
VALUES (DB_NAME(), OBJECT_NAME(@@PROCID), @ErrMsg);`
  },
  {
    sno: 10,
    category: 'SP Guidelines',
    guideline: "Place the RAISERROR statement at the very END of the CATCH block to ensure error logging into the T_Job_Error table completes before execution halts.",
    remarks: "RAISERROR terminates execution, so logging must happen first.",
    query: `RAISERROR(@ErrMsg, 16, 1) WITH NOWAIT;`
  },
  {
    sno: 11,
    category: 'SP Guidelines',
    guideline: "Break long queries across multiple lines if they exceed standard line length to ensure readability and prevent sp_helptext truncation.",
    remarks: "Prevents issues when generating deployment scripts or inspecting text via sp_helptext."
  },
  {
    sno: 12,
    category: 'SP Guidelines',
    guideline: "For organizational hierarchy details in report procedures, dynamically append them using a dedicated @ADDORGVAR parameter via STRING_AGG instead of legacy WHILE loops.",
    remarks: "Replaces inefficient cursor/while loops with high-performance set-based aggregation.",
    query: `SELECT @OrgMaxId = MAX(OrganisationHierarchy_TblRefID),
       @ADDORGVAR = STRING_AGG('RO.OrgName' + CAST(OrganisationHierarchy_TblRefID AS NVARCHAR(2)) + ' [' + OrganisationHierarchy_Name + '],', '')
FROM [MDMS_MASTER].[dbo].M_Organisation_Hierarchy(NOLOCK) 
WHERE OrganisationHierarchy_TblRefID > 1;`
  },
  {
    sno: 13,
    category: 'SP Guidelines',
    guideline: "Optimize filtering for Datetime / datetime2 / datetimeoffset fields by refraining from employing CAST/CONVERT/FORMAT functions and steering clear of the BETWEEN operator in both normal and dynamic queries.",
    remarks: "Preserves SARGability, enables Index Seeks, and avoids clustered index scans.",
    query: `-- Normal Query:
DECLARE @ToDateEND DATE = DATEADD(DAY, 1, @ToDate);
SELECT * FROM dbo.T_Data WHERE ts >= @FromDate AND ts < @ToDateEND;

-- Dynamic Query:
-- 'ts >= ''' + CAST(@FromDate AS NVARCHAR(10)) + ''' AND ts < ''' + CAST(@ToDateEND AS NVARCHAR(10)) + ''''`
  },
  {
    sno: 14,
    category: 'SP Guidelines',
    guideline: "Optimize filtering for Date fields by avoiding CAST/CONVERT and avoiding BETWEEN.",
    remarks: "Use open-ended boundary ranges: LogDate >= @FromDate AND LogDate < @ToDateEND.",
    query: `DECLARE @FromDateSTART DATE = DATEADD(DAY, -1, @FromDate);
DECLARE @ToDateEND DATE = DATEADD(DAY, 1, @ToDate);
SELECT * FROM dbo.T_Log WHERE LogDate > @FromDateSTART AND LogDate < @ToDateEND;`
  },
  {
    sno: 15,
    category: 'SP Guidelines',
    guideline: "When converting values to kilo, avoid dividing by 1000; multiply by 0.001 instead for accurate decimal precision in database operations.",
    remarks: "Multiplication by 0.001 prevents integer truncation errors and yields faster arithmetic.",
    query: `-- Preferred:
kwh * 0.001 
-- Instead of:
-- kwh / 1000`
  },
  {
    sno: 16,
    category: 'SP Guidelines',
    guideline: "Incorporate 'isactive' or 'isactivestatus' columns consistently across all stored procedures in our database to ensure uniformity and adherence to soft-delete data management practices."
  },
  {
    sno: 17,
    category: 'SP Guidelines',
    guideline: "Table aliases must be clear, concise, and consistent across all SQL queries. Follow prefix-based structure: 'M' for Master, 'L' for Lookup, 'T' for Transaction, 'S' for Staging, and 'R' for Report. Apply numeric suffixes (LNL1, LNL2, LNL3) when the same table is joined multiple times.",
    remarks: "Structured aliases ensure quick debugging and uniformity across all project queries."
  }
];

export const TABLE_GUIDELINES: GuidelineItem[] = [
  {
    sno: 1,
    category: 'Table Guidelines',
    guideline: "All tables must adhere to the specified prefix nomenclature: M for Master, L for Lookup, T for Transaction, S for Staging, and R for Report tables.",
    remarks: "Ensures a consistent, self-documenting database schema hierarchy across all database instances.",
    query: `-- Examples:
-- M_Organisation_Hierarchy (Master)
-- L_Network_Lookup (Lookup)
-- T_Consumer_Billing (Transaction)
-- S_RawMeterData (Staging)
-- R_Consumer_All (Report)`
  },
  {
    sno: 2,
    category: 'Table Guidelines',
    guideline: "Avoid making Identity column as the primary key for any Transaction table.",
    remarks: "Select natural keys or carefully chosen composite surrogate keys for optimal database performance and flexibility in high-volume transaction tables."
  },
  {
    sno: 3,
    category: 'Table Guidelines',
    guideline: "Avoid Identity columns for Aggregated / Summary tables; establish a robust composite primary key combination instead.",
    remarks: "Excluding identity columns in Aggregated tables eliminates wasted sequence storage and enforces natural uniqueness across dimensions."
  },
  {
    sno: 4,
    category: 'Table Guidelines',
    guideline: "Assign descriptive and meaningful names that reflect the business purpose of the table, promoting clarity and effective database organization."
  },
  {
    sno: 5,
    category: 'Table Guidelines',
    guideline: "Keep column names concise yet immediately identifiable to avoid excessive storage and metadata clutter."
  },
  {
    sno: 6,
    category: 'Table Guidelines',
    guideline: "Exercise caution when creating indexes; avoid hasty index creation without workload analysis, as redundant indexes degrade INSERT/UPDATE performance and consume disk space."
  },
  {
    sno: 7,
    category: 'Table Guidelines',
    guideline: "Always prefer 'datetime' data type over 'datetime2' and 'datetimeoffset' when creating standard tables to prevent potential issues, such as Excel export/download format mismatch variations.",
    remarks: "Use datetime2 and datetimeoffset selectively only when microsecond precision or timezone offsets are strictly required by system specifications."
  },
  {
    sno: 8,
    category: 'Table Guidelines',
    guideline: "Include only essential columns in transactional tables; supplementary master details should be retrieved through relational joins with dedicated Master tables."
  },
  {
    sno: 9,
    category: 'Table Guidelines',
    guideline: "Strictly avoid using SQL keywords such as Create, Created, Alter, Altered, Month, Year, Date, Status as column names, as these cause syntax errors and complications in dynamic SQL and ORM mapping.",
    remarks: "Preferred: CreatedDate, ModifiedDate, OrderStatus, ActivityMonth."
  },
  {
    sno: 10,
    category: 'Table Guidelines',
    guideline: "Enforce Primary Key constraints on every table to guarantee data integrity and establish proper foreign key relationships to optimize optimizer join elimination."
  },
  {
    sno: 11,
    category: 'Table Guidelines',
    guideline: "Column names must strictly avoid spaces or special characters in accordance with database naming conventions."
  }
];

export const NEW_YEAR_ACTIVITIES: GuidelineItem[] = [
  {
    sno: 1,
    category: 'New Year Activities',
    guideline: "Create a New Year Archive Database (e.g. [Database_2025_Archive])."
  },
  {
    sno: 2,
    category: 'New Year Activities',
    guideline: "Create a Partition Function in the New Year Archive Database configured for the upcoming year's boundaries."
  },
  {
    sno: 3,
    category: 'New Year Activities',
    guideline: "Create a dedicated New Year storage folder on the Database Server for partition files (e.g. 'D:\\Data\\Partitions\\2025')."
  },
  {
    sno: 4,
    category: 'New Year Activities',
    guideline: "Create Partitioned Files and Partition Scheme mapping partitions to the specified filegroups on the database server."
  },
  {
    sno: 5,
    category: 'New Year Activities',
    guideline: "Create Partitioned and Non-Partitioned Tables matching the source schema in the New Year Archive Database."
  },
  {
    sno: 6,
    category: 'New Year Activities',
    guideline: "Verify that the row counts of archived tables for the previous year correspond accurately with the new year archive counts."
  },
  {
    sno: 7,
    category: 'New Year Activities',
    guideline: "Ensure that the number of columns and column nullability in archived tables align with the updated production tables."
  },
  {
    sno: 8,
    category: 'New Year Activities',
    guideline: "Review all stored procedures to confirm whether any hardcoded database names corresponding to previous years' archives exist. Update references to accommodate the new year."
  },
  {
    sno: 9,
    category: 'New Year Activities',
    guideline: "Conduct a comprehensive monitoring exercise for one week following cutover to ensure seamless functionality of all scheduled jobs, websites, and data movements."
  }
];

export const NEW_DB_DEPLOY_CHECKLIST: GuidelineItem[] = [
  {
    sno: 1,
    category: 'New DB Deploy',
    guideline: "Verify VPN Access for the deployment server."
  },
  {
    sno: 2,
    category: 'New DB Deploy',
    guideline: "Verify Database Server RDP and OS access."
  },
  {
    sno: 3,
    category: 'New DB Deploy',
    guideline: "Verify DB Login authentication through local developer workstation."
  },
  {
    sno: 4,
    category: 'New DB Deploy',
    guideline: "Deploy the primary Database Creation scripts."
  },
  {
    sno: 5,
    category: 'New DB Deploy',
    guideline: "Generate all Database Schema scripts from the source environment."
  },
  {
    sno: 6,
    category: 'New DB Deploy',
    guideline: "Generate Master Data scripts from source. NOTE: Exclude m_login, m_users, and environment-specific credentials."
  },
  {
    sno: 7,
    category: 'New DB Deploy',
    guideline: "Deploy all generated schema and master data scripts in the new production server and resolve any compilation errors."
  },
  {
    sno: 8,
    category: 'New DB Deploy',
    guideline: "Create sample Organization, Network, and HES records in MDMS_MASTER."
  },
  {
    sno: 9,
    category: 'New DB Deploy',
    guideline: "Create one test administrative user and verify login from backend application."
  },
  {
    sno: 10,
    category: 'New DB Deploy',
    guideline: "Reset all staging and data movement counter tables before commencing live feeds.",
    remarks: "Mandatory counter reset script across all staging databases.",
    query: `UPDATE MIS_Staging.dbo.[M_Max_MoveData_MIS] SET DataCount = 0;
UPDATE Integration_Staging.dbo.M_Max_MoveData SET datacount = 0;
UPDATE MDMS_Staging.dbo.M_Max_MoveData SET datacount = 0;
UPDATE SCADADATA.dbo.M_Max_MoveData SET datacount = 0;`
  },
  {
    sno: 11,
    category: 'New DB Deploy',
    guideline: "Create and align all partitioned tables and partition schemes."
  },
  {
    sno: 12,
    category: 'New DB Deploy',
    guideline: "Update L_organization and M_organization based on the designated hierarchy depth."
  }
];

export const SERVER_SYNC_QUERIES: GuidelineItem[] = [
  {
    sno: 1,
    category: 'Hierarchy & Sync',
    guideline: "MDM Server ETL & Staging Counter Resets",
    query: `-- Reset ETL and Aggregation Log Counters
UPDATE mdms_stg.dbo.m_etl SET processcounter = 0;
UPDATE mdms_stg.dbo.m_log_dataaggregation_2023 SET dataid = 0;
UPDATE mdms_stg.dbo.m_log_dataaggregation_2024 SET dataid = 0;
UPDATE mdms_stg.dbo.m_max_movedata SET dataid = 0;
EXEC mdms_stg.dbo.usp_sync_master_from_mis;`
  },
  {
    sno: 2,
    category: 'Hierarchy & Sync',
    guideline: "MIS Server Master Data Sync & Lookup Cleanse",
    query: `-- Reset MIS logging counters
UPDATE mdms.dbo.m_etl_mis SET processcounter = 0;
UPDATE mdms..m_mis_log_dataaggregation_2023 SET dataid = 0;
UPDATE mdms..m_mis_log_dataaggregation_2024 SET dataid = 0;
UPDATE mdms.dbo.m_max_movedata SET dataid = 0;
UPDATE [integration_staging].dbo.m_max_movedata SET dataCount = 0;

-- Cleanse master tables (keep baseline row 1):
DELETE FROM M_Connection_Category WHERE ConnectionCategory_TblRefID <> 1;

-- Cleanse lookup and reseed identity:
DELETE FROM L_Organisation_Lookup;
DBCC CHECKIDENT('L_Organisation_Lookup', RESEED, 1);`
  }
];
