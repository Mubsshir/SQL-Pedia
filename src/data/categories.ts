import { CategoryMeta } from '../types';

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'Performance',
    name: 'Performance & DMVs',
    icon: 'Zap',
    description: 'Active requests, blocking chains, wait stats, CPU/memory pressure, and index health.',
    subcategories: ['Active Queries', 'Blocking & Deadlocks', 'Index Health', 'Wait Statistics', 'Resource Usage']
  },
  {
    id: 'Partitioning',
    name: 'Table Partitioning',
    icon: 'Layers',
    description: 'Partition distribution, boundaries, filegroups, functions, schemes, and min/max identities.',
    subcategories: ['Partition Inspection', 'Boundaries & Functions', 'Identity Tracking', 'Partition Maintenance']
  },
  {
    id: 'Stored Procedures',
    name: 'Stored Procedures & Debugging',
    icon: 'Bug',
    description: 'Search procedure definitions, inspect parameters, debug transactions, and handle errors cleanly.',
    subcategories: ['Search & Definitions', 'Parameters & Dependencies', 'Error Handling', 'Transaction Debugging']
  },
  {
    id: 'SQL Server Agent',
    name: 'SQL Server Agent',
    icon: 'Clock',
    description: 'Locate jobs running specific procedures, inspect job schedules, track failures, and running steps.',
    subcategories: ['Job Search', 'Job Execution', 'Job History & Schedules']
  },
  {
    id: 'Tables & Schema',
    name: 'Tables & Schema DDL',
    icon: 'Hammer',
    description: 'CREATE and ALTER TABLE cheat sheets, named constraints, identities, and safe DDL patterns.',
    subcategories: ['CREATE TABLE', 'ALTER TABLE', 'Constraints', 'Identity Columns']
  },
  {
    id: 'Data Operations',
    name: 'Data Operations (DML)',
    icon: 'Database',
    description: 'Safe bulk updates, batch deletes, UPSERT patterns, window functions, and deduplication.',
    subcategories: ['Safe Updates & Deletes', 'Window Functions', 'Deduplication', 'String & JSON Operations']
  },
  {
    id: 'Database',
    name: 'Database Administration',
    icon: 'Server',
    description: 'Database sizes, file growth settings, VLF counts, backup status, and recovery configurations.',
    subcategories: ['Database Sizing', 'File & Log Management', 'Backups & Maintenance']
  },
  {
    id: 'Developer Utilities',
    name: 'Developer Utilities',
    icon: 'Search',
    description: 'Find tables by column, locate objects, search SQL modules, inspect dependencies, and row counts.',
    subcategories: ['Object Discovery', 'Column Search', 'Data Profiling', 'Script Generation']
  },
  {
    id: 'Troubleshooting',
    name: 'Troubleshooting & Diagnostics',
    icon: 'AlertTriangle',
    description: 'Deadlock graphs, session input buffers, kill session with rollback progress, and latch contention.',
    subcategories: ['Deadlocks', 'Session Inspection', 'TempDB Contention']
  },
  {
    id: 'Best Practices',
    name: 'Best Practices & Anti-Patterns',
    icon: 'Lightbulb',
    description: 'SARGability guidelines, NOLOCK pitfalls, parameter sniffing, and query optimization patterns.',
    subcategories: ['Query Optimization', 'Concurrency & Locking', 'Dynamic SQL Safety']
  }
];
