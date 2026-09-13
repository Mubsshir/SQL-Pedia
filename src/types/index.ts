export type RiskLevel = 'safe' | 'caution' | 'destructive';

export type SqlServerVersion =
  | '2016+'
  | '2019+'
  | '2022+'
  | '2025+'
  | 'Version dependent';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type QueryCategory =
  | 'Performance'
  | 'Database'
  | 'Tables & Schema'
  | 'Partitioning'
  | 'Stored Procedures'
  | 'SQL Server Agent'
  | 'Data Operations'
  | 'Developer Utilities'
  | 'Best Practices'
  | 'Troubleshooting';

export interface QueryParameter {
  name: string;
  placeholder: string;
  description: string;
  defaultValue: string;
}

export interface ColumnInfo {
  name: string;
  description: string;
  type?: string;
}

export interface QuerySnippet {
  id: string;
  title: string;
  category: QueryCategory;
  subcategory?: string;
  description: string;
  sql: string;
  difficulty: DifficultyLevel;
  risk: RiskLevel;
  sqlServerVersion: SqlServerVersion;
  tags: string[];
  whenToUse: string;
  columnsReturned?: ColumnInfo[];
  notes?: string[];
  warnings?: string[];
  parameters?: QueryParameter[];
  relatedQueryIds: string[];
  featured?: boolean;
}

export interface CategoryMeta {
  id: QueryCategory;
  name: string;
  icon: string;
  description: string;
  itemCount?: number;
  subcategories: string[];
}

export interface SqlTip {
  id: string;
  title: string;
  category: string;
  problem: string;
  why: string;
  betterApproach: string;
  badCode?: string;
  goodCode?: string;
  tags: string[];
}

export interface TeamStandard {
  id: string;
  title: string;
  category: 'Naming Conventions' | 'Procedures & Functions' | 'Transactions & Concurrency' | 'Error Handling' | 'Performance & Indexing' | 'Style & Standards';
  summary: string;
  rules: {
    rule: string;
    description: string;
    example?: string;
    badExample?: string;
  }[];
}

export interface ChecklistItem {
  id: string;
  category: 'Performance' | 'Correctness & Logic' | 'Safety & Concurrency' | 'Style & Standards';
  title: string;
  description: string;
  critical?: boolean;
}
