import { QuerySnippet } from '../../types';

export const tablesSchemaQueries: QuerySnippet[] = [
  {
    id: 'create-table-complete',
    title: 'CREATE TABLE with Named Constraints (Team Standard)',
    category: 'Tables & Schema',
    subcategory: 'CREATE TABLE',
    description: 'Create a table demonstrating team naming conventions for Primary Key, Foreign Key, Default constraint (SYSUTCDATETIME), Unique, and Check constraints.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['create-table', 'constraints', 'primary-key', 'foreign-key', 'default', 'check', 'unique', 'standards'],
    featured: true,
    whenToUse: 'Use as the gold-standard reference when designing new relational schema tables.',
    sql: `CREATE TABLE dbo.Employee
(
    EmployeeId INT IDENTITY(1, 1) NOT NULL,
    DepartmentId INT NOT NULL,
    EmployeeCode VARCHAR(20) NOT NULL,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    Salary DECIMAL(18, 2) NOT NULL,
    IsActive BIT NOT NULL,
    CreatedDate DATETIME2(7) NOT NULL,
    ModifiedDate DATETIME2(7) NULL,

    -- Explicitly named constraints (Team Standard)
    CONSTRAINT PK_Employee 
        PRIMARY KEY CLUSTERED (EmployeeId),

    CONSTRAINT FK_Employee_Department 
        FOREIGN KEY (DepartmentId) REFERENCES dbo.Department (DepartmentId),

    CONSTRAINT UQ_Employee_Email 
        UNIQUE NONCLUSTERED (Email),

    CONSTRAINT UQ_Employee_Code 
        UNIQUE NONCLUSTERED (EmployeeCode),

    CONSTRAINT CK_Employee_Salary 
        CHECK (Salary >= 0),

    CONSTRAINT DF_Employee_IsActive 
        DEFAULT (1) FOR IsActive,

    CONSTRAINT DF_Employee_CreatedDate 
        DEFAULT (SYSUTCDATETIME()) FOR CreatedDate
);`,
    notes: [
      'Always give constraints explicit names (e.g. PK_TableName, FK_Source_Target, DF_TableName_ColName, CK_TableName_ColName).',
      'Never allow SQL Server to generate auto-named system default constraints like DF__Employee__Creat__382F5D, as they cause deployment collisions across dev/staging/prod.'
    ],
    relatedQueryIds: ['create-table-composite-pk', 'alter-table-add-column-safe', 'alter-table-add-constraint']
  },
  {
    id: 'create-table-composite-pk',
    title: 'CREATE TABLE with Composite Primary Key',
    category: 'Tables & Schema',
    subcategory: 'CREATE TABLE',
    description: 'Create junction or header-detail mapping tables with a composite primary key spanning multiple columns.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['create-table', 'composite-key', 'primary-key', 'junction-table'],
    whenToUse: 'For many-to-many relationship junction tables or multi-part partition/tenant identifiers.',
    sql: `CREATE TABLE dbo.OrderLineItem
(
    OrderId INT NOT NULL,
    LineNumber SMALLINT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL,
    CreatedDate DATETIME2 NOT NULL CONSTRAINT DF_OrderLineItem_CreatedDate DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT PK_OrderLineItem 
        PRIMARY KEY CLUSTERED (OrderId, LineNumber),

    CONSTRAINT FK_OrderLineItem_Order 
        FOREIGN KEY (OrderId) REFERENCES dbo.Orders (OrderId) ON DELETE CASCADE,

    CONSTRAINT FK_OrderLineItem_Product 
        FOREIGN KEY (ProductId) REFERENCES dbo.Product (ProductId),

    CONSTRAINT CK_OrderLineItem_Quantity 
        CHECK (Quantity > 0)
);`,
    relatedQueryIds: ['create-table-complete']
  },
  {
    id: 'alter-table-add-column-safe',
    title: 'ALTER TABLE Add Column (Safe Idempotent Pattern)',
    category: 'Tables & Schema',
    subcategory: 'ALTER TABLE',
    description: 'Safely add a new column to an existing table only if the column does not already exist, preventing migration script errors.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['alter-table', 'add-column', 'idempotent', 'sys.columns', 'migration'],
    featured: true,
    whenToUse: 'Production migration scripts and repeatable schema deployment pipelines.',
    parameters: [
      {
        name: 'SchemaName',
        placeholder: "'dbo'",
        description: 'Target schema',
        defaultValue: "'dbo'"
      },
      {
        name: 'TableName',
        placeholder: "'Employee'",
        description: 'Target table',
        defaultValue: "'Employee'"
      },
      {
        name: 'ColumnName',
        placeholder: "'PhoneNumber'",
        description: 'Column to add',
        defaultValue: "'PhoneNumber'"
      }
    ],
    sql: `IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns c
    INNER JOIN sys.tables t ON c.object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = 'dbo' 
      AND t.name = 'Employee' 
      AND c.name = 'PhoneNumber'
)
BEGIN
    ALTER TABLE dbo.Employee 
    ADD PhoneNumber VARCHAR(20) NULL;

    PRINT 'Column PhoneNumber added to dbo.Employee.';
END
ELSE
BEGIN
    PRINT 'Column PhoneNumber already exists on dbo.Employee — skipping.';
END;`,
    notes: [
      'In SQL Server 2016+, adding a NOT NULL column with a DEFAULT value is an online metadata-only operation and does not re-write every row.'
    ],
    relatedQueryIds: ['alter-table-drop-column-safe', 'alter-table-modify-column']
  },
  {
    id: 'alter-table-drop-column-safe',
    title: 'ALTER TABLE Drop Column (Safe with Constraint Cleanup)',
    category: 'Tables & Schema',
    subcategory: 'ALTER TABLE',
    description: 'Safely drop a column by first dropping any attached default constraint or check constraint before executing DROP COLUMN.',
    difficulty: 'Intermediate',
    risk: 'destructive',
    sqlServerVersion: '2016+',
    tags: ['alter-table', 'drop-column', 'constraints', 'cleanup', 'destructive'],
    whenToUse: 'When removing deprecated columns that may have attached default or check constraints blocking the drop.',
    sql: `-- 1. Find and drop any default constraint attached to the column
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c
    ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID('dbo.Employee')
  AND c.name = 'PhoneNumber';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Employee DROP CONSTRAINT ' + QUOTENAME(@ConstraintName));
    PRINT 'Dropped constraint ' + @ConstraintName;
END;

-- 2. Drop the column safely
IF COL_LENGTH('dbo.Employee', 'PhoneNumber') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Employee 
    DROP COLUMN PhoneNumber;

    PRINT 'Dropped column PhoneNumber from dbo.Employee.';
END;`,
    warnings: [
      'Dropping a column permanently deletes all data stored in that column.',
      'Check if the column is referenced in any views, stored procedures, or indexes before dropping!'
    ],
    relatedQueryIds: ['alter-table-add-column-safe', 'find-tables-with-column']
  },
  {
    id: 'alter-table-modify-column',
    title: 'ALTER TABLE Modify Column Data Type / Nullability',
    category: 'Tables & Schema',
    subcategory: 'ALTER TABLE',
    description: 'Change column data type length or adjust NULL / NOT NULL nullability.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['alter-column', 'data-type', 'nullability', 'length'],
    whenToUse: 'Expanding column width (e.g. VARCHAR(50) to VARCHAR(100)) or setting a column to NOT NULL after backfilling data.',
    sql: `-- Increase string length (fast metadata operation if column is unindexed)
ALTER TABLE dbo.Employee 
ALTER COLUMN LastName NVARCHAR(100) NOT NULL;

-- Change nullability to NOT NULL (requires all existing rows to have non-null values)
ALTER TABLE dbo.Employee 
ALTER COLUMN PhoneNumber VARCHAR(20) NOT NULL;`,
    notes: [
      'You cannot alter a column that is used in a PRIMARY KEY, FOREIGN KEY, or computed column definition without dropping that constraint first.'
    ],
    relatedQueryIds: ['alter-table-add-column-safe']
  },
  {
    id: 'alter-table-add-constraint',
    title: 'ALTER TABLE Add Primary Key / Foreign Key / Check / Default',
    category: 'Tables & Schema',
    subcategory: 'Constraints',
    description: 'Add named constraints to an existing table post-creation.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['add-constraint', 'foreign-key', 'check', 'default', 'alter-table'],
    whenToUse: 'When applying schema validations or relationships to pre-existing tables.',
    sql: `-- 1. Add Named Primary Key
ALTER TABLE dbo.Employee
ADD CONSTRAINT PK_Employee PRIMARY KEY CLUSTERED (EmployeeId);

-- 2. Add Named Foreign Key (WITH CHECK ensures existing data conforms)
ALTER TABLE dbo.Employee WITH CHECK
ADD CONSTRAINT FK_Employee_Department 
    FOREIGN KEY (DepartmentId) REFERENCES dbo.Department (DepartmentId);

-- 3. Add Named Default Constraint
ALTER TABLE dbo.Employee
ADD CONSTRAINT DF_Employee_CreatedDate 
    DEFAULT SYSUTCDATETIME() FOR CreatedDate;

-- 4. Add Named Check Constraint
ALTER TABLE dbo.Employee WITH CHECK
ADD CONSTRAINT CK_Employee_Salary 
    CHECK (Salary >= 0);

-- 5. Add Named Unique Constraint
ALTER TABLE dbo.Employee
ADD CONSTRAINT UQ_Employee_Email 
    UNIQUE NONCLUSTERED (Email);`,
    relatedQueryIds: ['create-table-complete', 'drop-constraint-safe']
  },
  {
    id: 'drop-constraint-safe',
    title: 'DROP Constraint (Safe Check Pattern)',
    category: 'Tables & Schema',
    subcategory: 'Constraints',
    description: 'Safely drop constraints (PK, FK, DF, CK, UQ) with an IF EXISTS check on sys.objects.',
    difficulty: 'Beginner',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['drop-constraint', 'safe', 'if-exists', 'sys.objects'],
    whenToUse: 'Before performing batch loads or table refactoring where constraints need temporary removal.',
    sql: `IF EXISTS (
    SELECT 1 
    FROM sys.objects 
    WHERE name = 'CK_Employee_Salary' 
      AND parent_object_id = OBJECT_ID('dbo.Employee')
)
BEGIN
    ALTER TABLE dbo.Employee 
    DROP CONSTRAINT CK_Employee_Salary;

    PRINT 'Constraint CK_Employee_Salary dropped successfully.';
END;`,
    relatedQueryIds: ['alter-table-add-constraint']
  },
  {
    id: 'computed-columns-persisted',
    title: 'Computed Columns (Virtual vs PERSISTED with Indexing)',
    category: 'Tables & Schema',
    subcategory: 'Constraints',
    description: 'Add deterministic computed columns, understand when to use the PERSISTED keyword, and create nonclustered indexes on computed expressions.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['computed-column', 'persisted', 'deterministic', 'indexing'],
    whenToUse: 'When optimizing calculations frequently evaluated in WHERE clauses (e.g. TotalPrice = Quantity * UnitPrice).',
    sql: `-- 1. Add PERSISTED computed column (physically stored, updated on row write)
ALTER TABLE dbo.OrderLineItem 
ADD ExtendedPrice AS (Quantity * UnitPrice) PERSISTED;

-- 2. Index the computed column for high-speed seeks
CREATE NONCLUSTERED INDEX IX_OrderLineItem_ExtendedPrice 
ON dbo.OrderLineItem (ExtendedPrice);

-- 3. String expression example (extracting domain from email)
ALTER TABLE dbo.Employee
ADD EmailDomain AS (SUBSTRING(Email, CHARINDEX('@', Email) + 1, 200)) PERSISTED;`,
    notes: [
      'PERSISTED columns are physically written to disk. The expression must be deterministic.',
      'Allows the query optimizer to seek on calculations without rewriting queries.'
    ],
    relatedQueryIds: ['create-table-complete', 'alter-table-add-column-safe']
  },
  {
    id: 'rename-column-or-object-safe',
    title: 'Rename Column or Table with sp_rename',
    category: 'Tables & Schema',
    subcategory: 'ALTER TABLE',
    description: 'Safely rename columns, tables, or indexes using sp_rename, with warnings regarding broken stored procedures and dependencies.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['sp_rename', 'rename-column', 'rename-table', 'schema'],
    whenToUse: 'Correcting typos or refactoring legacy column names.',
    sql: `-- 1. Rename a Column
EXEC sys.sp_rename 
    @objname = N'dbo.Employee.OldColumnName', 
    @newname = N'NewColumnName', 
    @objtype = 'COLUMN';

-- 2. Rename an Index
-- EXEC sys.sp_rename 
--     @objname = N'dbo.Employee.IX_OldIndexName', 
--     @newname = N'IX_NewIndexName', 
--     @objtype = 'INDEX';

-- 3. Rename a Table
-- EXEC sys.sp_rename 
--     @objname = N'dbo.OldTableName', 
--     @newname = N'NewTableName';`,
    warnings: [
      'Changing any part of an object name can break scripts and stored procedures referencing the old name.',
      'Always run a dependency search (sys.sql_expression_dependencies) before renaming production columns!'
    ],
    relatedQueryIds: ['find-tables-with-column', 'find-procedures-referencing-table']
  },
  {
    id: 'foreign-key-trusted-check',
    title: 'Find & Fix Untrusted Foreign Keys (WITH CHECK)',
    category: 'Tables & Schema',
    subcategory: 'Constraints',
    description: 'Identify untrusted foreign keys (is_not_trusted = 1) that the query optimizer ignores during join elimination, and re-validate them with WITH CHECK.',
    difficulty: 'Intermediate',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['foreign-key', 'is_not_trusted', 'trusted', 'join-elimination', 'sys.foreign_keys'],
    whenToUse: 'After bulk data loads where constraints were disabled or created with NOCHECK.',
    sql: `-- Step 1: Find all untrusted foreign keys in the current database
SELECT
    s.name AS SchemaName,
    t.name AS TableName,
    fk.name AS ForeignKeyName,
    'ALTER TABLE ' + QUOTENAME(s.name) + '.' + QUOTENAME(t.name) 
        + ' WITH CHECK CHECK CONSTRAINT ' + QUOTENAME(fk.name) + ';' AS FixUntrustedConstraintScript
FROM sys.foreign_keys fk
INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE fk.is_not_trusted = 1
  AND fk.is_disabled = 0
ORDER BY SchemaName, TableName;

-- Step 2: Execute generated ALTER TABLE ... WITH CHECK CHECK CONSTRAINT commands.`,
    notes: [
      'Untrusted foreign keys are ignored by the query optimizer for Join Elimination and cardinality estimates!',
      'Executing ALTER TABLE ... CHECK CONSTRAINT re-enables enforcement but leaves it UNTRUSTED. You MUST specify WITH CHECK to restore optimizer trust.'
    ],
    relatedQueryIds: ['alter-table-add-constraint']
  }
];

