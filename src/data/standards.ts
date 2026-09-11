import { TeamStandard } from '../types';

export const TEAM_STANDARDS: TeamStandard[] = [
  {
    id: 'naming-conventions',
    title: 'Database Object & Constraint Naming Standards',
    category: 'Naming Conventions',
    summary: 'Consistent naming conventions ensure clarity, prevent deployment collisions, and simplify database administration.',
    rules: [
      {
        rule: 'Tables & Views',
        description: 'Use PascalCase with singular nouns. Never prefix user tables with "tbl_" or "tbl".',
        example: 'dbo.Customer, dbo.OrderLineItem, dbo.Invoice',
        badExample: 'dbo.tbl_Customers, dbo.tblOrders, dbo.orders_table'
      },
      {
        rule: 'Stored Procedures',
        description: 'Prefix stored procedures with "usp_" (User Stored Procedure) followed by VerbNoun in PascalCase. NEVER use "sp_" (reserved for master system stored procedures).',
        example: 'dbo.usp_GetCustomerOrders, dbo.usp_ProcessDailyInvoices',
        badExample: 'dbo.sp_GetCustomerOrders (triggers master database catalog scan!)'
      },
      {
        rule: 'Primary Keys',
        description: 'Prefix with "PK_" followed by the table name.',
        example: 'CONSTRAINT PK_Customer PRIMARY KEY CLUSTERED (CustomerId)',
        badExample: 'CONSTRAINT PK1, or allowing SQL Server auto-generated system names'
      },
      {
        rule: 'Foreign Keys',
        description: 'Prefix with "FK_" followed by SourceTable_TargetTable (and column if ambiguous).',
        example: 'CONSTRAINT FK_Order_Customer FOREIGN KEY (CustomerId) REFERENCES dbo.Customer (CustomerId)',
        badExample: 'FK_1234, FK_Customer'
      },
      {
        rule: 'Default Constraints',
        description: 'Prefix with "DF_" followed by TableName_ColumnName.',
        example: 'CONSTRAINT DF_Customer_CreatedDate DEFAULT (SYSUTCDATETIME()) FOR CreatedDate',
        badExample: 'DF__Customer__Creat__382F5D'
      },
      {
        rule: 'Indexes',
        description: 'Prefix with "IX_" for Non-Clustered indexes, "UX_" for Unique Non-Clustered, "CIX_" for Clustered.',
        example: 'IX_Customer_LastName_FirstName, UX_Employee_Email',
        badExample: 'Index1, Customer_Idx'
      }
    ]
  },
  {
    id: 'stored-procedure-standards',
    title: 'Stored Procedure Development Standards',
    category: 'Procedures & Functions',
    summary: 'Every procedure authored by the team must follow these mandatory operational standards.',
    rules: [
      {
        rule: 'SET NOCOUNT ON is Mandatory',
        description: 'Place SET NOCOUNT ON at the very beginning of the procedure body. This prevents SQL Server from transmitting "X rows affected" TDS message packets back to the client for every internal statement.',
        example: 'CREATE OR ALTER PROCEDURE dbo.usp_Example AS BEGIN SET NOCOUNT ON; ... END;'
      },
      {
        rule: 'SET XACT_ABORT ON for Transactions',
        description: 'When using transactions inside stored procedures, include SET XACT_ABORT ON. If a runtime error occurs, the transaction is automatically rolled back, preventing orphaned locks.',
        example: 'SET NOCOUNT ON;\nSET XACT_ABORT ON;'
      },
      {
        rule: 'Always Include Standard TRY...CATCH & THROW',
        description: 'Wrap data modifications in BEGIN TRY ... END TRY BEGIN CATCH. Check XACT_STATE() <> 0 before calling ROLLBACK. Always use THROW to preserve original error context.',
        example: 'BEGIN CATCH IF XACT_STATE() <> 0 ROLLBACK TRAN; THROW; END CATCH;'
      },
      {
        rule: 'Never Use SELECT *',
        description: 'Every SELECT query in a procedure or view must explicitly enumerate the exact required columns.',
        example: 'SELECT CustomerId, FirstName, Email FROM dbo.Customer;'
      }
    ]
  },
  {
    id: 'transaction-locking-standards',
    title: 'Transaction Management & Concurrency Standards',
    category: 'Transactions & Concurrency',
    summary: 'Guidelines to prevent deadlocks, reduce lock hold times, and guarantee ACID compliance.',
    rules: [
      {
        rule: 'Keep Transactions as Short as Possible',
        description: 'Only wrap the actual data mutation statements (INSERT, UPDATE, DELETE) inside BEGIN TRAN ... COMMIT. Never perform data preparation, temporary table creation, or external API calls inside an open transaction.',
        example: '-- Prepare data in #temp table outside transaction\nBEGIN TRANSACTION;\nINSERT INTO dbo.Orders ...\nCOMMIT TRANSACTION;'
      },
      {
        rule: 'Locking Hierarchy & Deadlock Prevention',
        description: 'When updating multiple tables across different stored procedures, always acquire locks and access tables in the SAME alphabetical or logical order (e.g. Orders then OrderDetails).',
        example: 'Proc A: Access TableA then TableB\nProc B: Access TableA then TableB (NEVER reverse order!)'
      },
      {
        rule: 'No User Interaction or Network Calls in Transactions',
        description: 'Never wait for external client input or send emails while holding active transaction locks.',
        example: 'Complete business calculation -> Open transaction -> Apply update -> Commit immediately.'
      }
    ]
  },
  {
    id: 'query-formatting-standards',
    title: 'SQL Code Style & Formatting Standards',
    category: 'Style & Standards',
    summary: 'Clean, uniform T-SQL code formatting ensures high readability and painless team pull requests.',
    rules: [
      {
        rule: 'UPPERCASE for SQL Keywords',
        description: 'All SQL keywords must be typed in uppercase (SELECT, FROM, WHERE, INNER JOIN, GROUP BY, ORDER BY, CTE).',
        example: 'SELECT CustomerId FROM dbo.Customer WHERE IsActive = 1;'
      },
      {
        rule: 'Terminate Statements with Semicolons',
        description: 'Every statement must be terminated with a semicolon (;). CTEs must be preceded by a semicolon (;WITH CTE AS...).',
        example: 'UPDATE dbo.Customer SET IsActive = 0 WHERE CustomerId = 10; -- Terminated with semicolon'
      },
      {
        rule: 'Always Use Two-Part Object Names',
        description: 'Always prefix tables, views, and procedures with their schema name (e.g. dbo.Customer, not Customer).',
        example: 'FROM dbo.Customer c (Avoid naked FROM Customer)'
      },
      {
        rule: 'Meaningful Table Aliases',
        description: 'Use short, intuitive acronyms or abbreviations for aliases instead of arbitrary single letters like a, b, c.',
        example: 'FROM dbo.Customer c INNER JOIN dbo.CustomerOrder co ON c.CustomerId = co.CustomerId'
      }
    ]
  }
];
