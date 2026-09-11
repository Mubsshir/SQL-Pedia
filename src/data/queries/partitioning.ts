import { QuerySnippet } from '../../types';

export const partitioningQueries: QuerySnippet[] = [
  {
    id: 'partition-information',
    title: 'Team Partition Information & Filegroup Mapping',
    category: 'Partitioning',
    subcategory: 'Partition Inspection',
    description: 'Inspect partition details, boundary ranges, destination filegroups, and row counts for a partitioned table.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['partitioning', 'partitions', 'filegroups', 'allocation_units', 'boundaries', 't_nw_dlp'],
    featured: true,
    whenToUse: 'Check row distribution and filegroup storage mapping across partitions for large enterprise tables.',
    parameters: [
      {
        name: 'TableName',
        placeholder: "'t_nw_dlp'",
        description: 'Target partitioned table name',
        defaultValue: "'t_nw_dlp'"
      }
    ],
    sql: `SELECT DISTINCT
    o.name AS table_name,
    rv.value AS partition_range,
    fg.name AS file_groupName,
    p.partition_number,
    p.rows AS number_of_rows
FROM sys.partitions p
INNER JOIN sys.indexes i
    ON p.object_id = i.object_id
    AND p.index_id = i.index_id
INNER JOIN sys.objects o
    ON p.object_id = o.object_id
INNER JOIN sys.system_internals_allocation_units au
    ON p.partition_id = au.container_id
INNER JOIN sys.partition_schemes ps
    ON ps.data_space_id = i.data_space_id
INNER JOIN sys.partition_functions f
    ON f.function_id = ps.function_id
INNER JOIN sys.destination_data_spaces dds
    ON dds.partition_scheme_id = ps.data_space_id
    AND dds.destination_id = p.partition_number
INNER JOIN sys.filegroups fg
    ON dds.data_space_id = fg.data_space_id
LEFT OUTER JOIN sys.partition_range_values rv
    ON f.function_id = rv.function_id
    AND p.partition_number = rv.boundary_id
WHERE o.object_id = OBJECT_ID('t_nw_dlp')
ORDER BY p.partition_number;`,
    columnsReturned: [
      { name: 'table_name', description: 'Partitioned table name' },
      { name: 'partition_range', description: 'Boundary value marking the edge of this partition' },
      { name: 'file_groupName', description: 'Physical filegroup where this partition data resides' },
      { name: 'partition_number', description: '1-based partition number index' },
      { name: 'number_of_rows', description: 'Exact row count currently stored in this partition' }
    ],
    notes: [
      'The partition_range boundary value will be NULL for the leftmost partition in RANGE RIGHT functions or rightmost in RANGE LEFT.',
      'sys.system_internals_allocation_units maps the partition directly to its physical storage unit.'
    ],
    relatedQueryIds: ['find-partition-number-for-value', 'partition-boundaries', 'partition-min-max-identity']
  },
  {
    id: 'find-partition-number-for-value',
    title: 'Find Partition Number for a Specific Value',
    category: 'Partitioning',
    subcategory: 'Partition Inspection',
    description: 'Use the $PARTITION function to determine which partition number a specific date, ID, or range value will route into.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['partition', '$partition', 'routing', 'boundary', 'lookup'],
    whenToUse: 'Quickly verify where a specific record or date will be placed before inserting or querying.',
    parameters: [
      {
        name: 'FunctionName',
        placeholder: 'pf_OrderDate',
        description: 'Partition function name',
        defaultValue: 'pf_OrderDate'
      },
      {
        name: 'TestValue',
        placeholder: "'2026-03-15'",
        description: 'Value to evaluate',
        defaultValue: "'2026-03-15'"
      }
    ],
    sql: `-- Resolve destination partition number using $PARTITION
SELECT 
    $PARTITION.pf_OrderDate('2026-03-15') AS DestinationPartitionNumber;

-- Optional: Query only records from that specific partition
SELECT * 
FROM dbo.Orders
WHERE $PARTITION.pf_OrderDate(OrderDate) = $PARTITION.pf_OrderDate('2026-03-15');`,
    columnsReturned: [
      { name: 'DestinationPartitionNumber', description: 'The partition ID where the value will be stored' }
    ],
    notes: [
      '$PARTITION.FunctionName(value) evaluates against the partition function directly without querying the physical table.'
    ],
    relatedQueryIds: ['partition-information', 'partition-boundaries']
  },
  {
    id: 'partition-boundaries',
    title: 'Partition Boundaries & Function Definition',
    category: 'Partitioning',
    subcategory: 'Boundaries & Functions',
    description: 'Inspect partition functions, boundary values, RANGE LEFT vs RANGE RIGHT orientation, and data types.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['partition_function', 'range_left', 'range_right', 'boundaries', 'sys.partition_range_values'],
    whenToUse: 'When auditing partition functions or determining if boundaries are inclusive on the left or right side.',
    sql: `SELECT
    f.name AS FunctionName,
    f.type_desc AS BoundaryType, -- RANGE LEFT or RANGE RIGHT
    prv.boundary_id,
    prv.value AS BoundaryValue,
    t.name AS DataType,
    p.precision,
    p.scale
FROM sys.partition_functions f
INNER JOIN sys.partition_parameters p
    ON f.function_id = p.function_id
INNER JOIN sys.types t
    ON p.user_type_id = t.user_type_id
LEFT JOIN sys.partition_range_values prv
    ON f.function_id = prv.function_id
ORDER BY f.name, prv.boundary_id;`,
    columnsReturned: [
      { name: 'FunctionName', description: 'Name of the partition function' },
      { name: 'BoundaryType', description: 'RANGE LEFT (<= boundary) or RANGE RIGHT (< boundary)' },
      { name: 'boundary_id', description: 'Sequence number of the boundary value' },
      { name: 'BoundaryValue', description: 'Literal boundary threshold (e.g. 2026-01-01)' }
    ],
    notes: [
      'RANGE RIGHT means: BoundaryValue <= X < NextBoundaryValue. Recommended for date-based partitioning to keep whole days/months together.',
      'RANGE LEFT means: PreviousBoundaryValue < X <= BoundaryValue.'
    ],
    relatedQueryIds: ['partition-information', 'partition-scheme-filegroups']
  },
  {
    id: 'partition-min-max-identity',
    title: 'Minimum & Maximum Identity Per Partition',
    category: 'Partitioning',
    subcategory: 'Identity Tracking',
    description: 'Query the lowest and highest identity / primary key values stored within each individual partition to verify data alignment.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['identity', 'min', 'max', 'partition', 'distribution', 'alignment'],
    whenToUse: 'Validate that surrogate identity keys or clustered keys strictly match partition boundaries without leakage.',
    parameters: [
      {
        name: 'TableName',
        placeholder: 'dbo.Orders',
        description: 'Partitioned table',
        defaultValue: 'dbo.Orders'
      },
      {
        name: 'IdentityColumn',
        placeholder: 'OrderId',
        description: 'Identity column name',
        defaultValue: 'OrderId'
      },
      {
        name: 'PartitionFunction',
        placeholder: 'pf_OrderId',
        description: 'Partition function name',
        defaultValue: 'pf_OrderId'
      }
    ],
    sql: `SELECT
    $PARTITION.pf_OrderId(OrderId) AS PartitionNumber,
    COUNT_BIG(*) AS RowCounts,
    MIN(OrderId) AS MinIdentityValue,
    MAX(OrderId) AS MaxIdentityValue
FROM dbo.Orders
GROUP BY $PARTITION.pf_OrderId(OrderId)
ORDER BY PartitionNumber;`,
    columnsReturned: [
      { name: 'PartitionNumber', description: 'Partition number' },
      { name: 'RowCounts', description: 'Rows in that partition' },
      { name: 'MinIdentityValue', description: 'Lowest identity key value found in this partition' },
      { name: 'MaxIdentityValue', description: 'Highest identity key value found in this partition' }
    ],
    notes: [
      'Allows verifying whether auto-increment identity column sequences match the expected partition layout.'
    ],
    relatedQueryIds: ['partition-information', 'partition-empty-check']
  },
  {
    id: 'partition-scheme-filegroups',
    title: 'Partition Scheme to Filegroup Mappings',
    category: 'Partitioning',
    subcategory: 'Boundaries & Functions',
    description: 'Inspect all partition schemes and the corresponding physical filegroups allocated for each partition destination.',
    difficulty: 'Intermediate',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['partition_scheme', 'filegroups', 'data_spaces', 'storage'],
    whenToUse: 'Ensure each partition routes to the intended storage tier or SSD filegroup.',
    sql: `SELECT
    ps.name AS PartitionSchemeName,
    pf.name AS PartitionFunctionName,
    dds.destination_id AS PartitionNumber,
    fg.name AS FilegroupName
FROM sys.partition_schemes ps
INNER JOIN sys.partition_functions pf
    ON ps.function_id = pf.function_id
INNER JOIN sys.destination_data_spaces dds
    ON ps.data_space_id = dds.partition_scheme_id
INNER JOIN sys.filegroups fg
    ON dds.data_space_id = fg.data_space_id
ORDER BY ps.name, dds.destination_id;`,
    columnsReturned: [
      { name: 'PartitionSchemeName', description: 'Name of the partition scheme' },
      { name: 'PartitionFunctionName', description: 'Associated partition function' },
      { name: 'PartitionNumber', description: 'Partition sequence number' },
      { name: 'FilegroupName', description: 'Target filegroup name (e.g. FG_2026_Q1)' }
    ],
    relatedQueryIds: ['partition-information']
  },
  {
    id: 'partition-empty-check',
    title: 'Find Empty & Outdated Partitions',
    category: 'Partitioning',
    subcategory: 'Partition Maintenance',
    description: 'Detect partitions with zero rows, useful for identifying pruned historical partitions or future pre-allocated partitions.',
    difficulty: 'Beginner',
    risk: 'safe',
    sqlServerVersion: '2016+',
    tags: ['empty-partitions', 'zero-rows', 'pruning', 'cleanup'],
    whenToUse: 'During partition maintenance to safely merge empty old partitions or ensure future partitions are created ahead of time.',
    sql: `SELECT
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    o.name AS TableName,
    p.partition_number,
    p.rows,
    rv.value AS BoundaryValue
FROM sys.partitions p
INNER JOIN sys.objects o
    ON p.object_id = o.object_id
INNER JOIN sys.indexes i
    ON p.object_id = i.object_id AND p.index_id = i.index_id
INNER JOIN sys.partition_schemes ps
    ON i.data_space_id = ps.data_space_id
INNER JOIN sys.partition_functions f
    ON ps.function_id = f.function_id
LEFT JOIN sys.partition_range_values rv
    ON f.function_id = rv.function_id AND p.partition_number = rv.boundary_id
WHERE i.index_id IN (0, 1) -- Heap or Clustered Index
  AND p.rows = 0
ORDER BY o.name, p.partition_number;`,
    columnsReturned: [
      { name: 'TableName', description: 'Table name' },
      { name: 'partition_number', description: 'Partition number with 0 rows' },
      { name: 'BoundaryValue', description: 'Range boundary value' }
    ],
    relatedQueryIds: ['partition-information', 'partition-switch-template']
  },
  {
    id: 'partition-switch-template',
    title: 'Partition Switching Template (Fast Data Archival)',
    category: 'Partitioning',
    subcategory: 'Partition Maintenance',
    description: 'Standard metadata-only SWITCH PARTITION script to instantly move millions of rows from a source table into a staging or archive table.',
    difficulty: 'Advanced',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['switch', 'archive', 'staging', 'metadata-only', 'maintenance', 'fast'],
    whenToUse: 'Perform near-instantaneous archival of old data partitions without generating transaction log bloat or locking the active table.',
    parameters: [
      {
        name: 'SourceTable',
        placeholder: 'dbo.ActiveOrders',
        description: 'Source partitioned table',
        defaultValue: 'dbo.ActiveOrders'
      },
      {
        name: 'PartitionNumber',
        placeholder: '1',
        description: 'Partition number to switch out',
        defaultValue: '1'
      },
      {
        name: 'TargetTable',
        placeholder: 'dbo.ArchiveOrders_2024',
        description: 'Empty staging or archive table with exact matching schema and constraints',
        defaultValue: 'dbo.ArchiveOrders_2024'
      }
    ],
    sql: `-- 1. Ensure target table exists with IDENTICAL columns, types, nullability, and indexes
-- 2. Target table must be empty and reside on the SAME FILEGROUP as the source partition
-- 3. Target table must have a CHECK constraint matching the partition boundary

ALTER TABLE dbo.ActiveOrders 
SWITCH PARTITION 1 TO dbo.ArchiveOrders_2024;

-- If target is also partitioned:
-- ALTER TABLE dbo.ActiveOrders 
-- SWITCH PARTITION 1 TO dbo.ArchiveOrders PARTITION 1;`,
    notes: [
      'Partition switching is a metadata-only operation and completes in milliseconds regardless of row count.',
      'All non-clustered indexes on the source table must be ALIGNED (partitioned on the same scheme).',
      'The target table must be empty and have identical column types, nullability, and index definitions.'
    ],
    warnings: [
      'Requires schema modification locks on both tables during the switch instant.'
    ],
    relatedQueryIds: ['partition-information', 'partition-empty-check']
  },
  {
    id: 'split-partition-range',
    title: 'Split Partition Range (Add Future Partition)',
    category: 'Partitioning',
    subcategory: 'Partition Maintenance',
    description: 'Prepare a filegroup with NEXT USED and execute ALTER PARTITION FUNCTION ... SPLIT RANGE to add a new boundary value for future months or years.',
    difficulty: 'Advanced',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['split-range', 'next-used', 'partition-maintenance', 'alter-partition-function'],
    whenToUse: 'Quarterly or annual partition maintenance to ensure the partition function has empty future boundary slots.',
    sql: `-- Step 1: Designate the target filegroup for the new partition in the partition scheme
ALTER PARTITION SCHEME ps_OrderDate
NEXT USED [PRIMARY]; -- Or dedicated filegroup e.g. [FG_2027_Q1]

-- Step 2: Split the partition function to introduce the new boundary
ALTER PARTITION FUNCTION pf_OrderDate()
SPLIT RANGE ('2027-01-01');`,
    notes: [
      'CRITICAL: Ensure the partition being split is completely EMPTY before splitting! Splitting a partition with data causes massive row data movement and heavy logging.'
    ],
    relatedQueryIds: ['partition-information', 'merge-partition-range']
  },
  {
    id: 'merge-partition-range',
    title: 'Merge Partition Range (Prune Historical Partition)',
    category: 'Partitioning',
    subcategory: 'Partition Maintenance',
    description: 'Merge an obsolete or empty boundary value into an adjacent partition after old data has been switched out.',
    difficulty: 'Advanced',
    risk: 'caution',
    sqlServerVersion: '2016+',
    tags: ['merge-range', 'pruning', 'alter-partition-function', 'cleanup'],
    whenToUse: 'After switching out historical partitions to reduce partition count.',
    sql: `-- Step 1: Verify the partition to merge contains 0 rows (via sys.partitions)
-- Step 2: Merge the boundary value into the adjacent partition
ALTER PARTITION FUNCTION pf_OrderDate()
MERGE RANGE ('2023-01-01');`,
    notes: [
      'MERGE removes the boundary value, collapsing two adjacent partitions into one.',
      'Always switch data out first so the partition is empty before merging.'
    ],
    relatedQueryIds: ['partition-switch-template', 'split-partition-range']
  }
];

