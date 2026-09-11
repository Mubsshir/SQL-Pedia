import { QuerySnippet, QueryCategory } from '../types';
import { performanceQueries } from './queries/performance';
import { partitioningQueries } from './queries/partitioning';
import { sqlAgentQueries } from './queries/sqlAgent';
import { storedProceduresQueries } from './queries/storedProcedures';
import { tablesSchemaQueries } from './queries/tablesSchema';
import { dataOperationsQueries } from './queries/dataOperations';
import { developerUtilsQueries } from './queries/developerUtils';
import { databaseAdminQueries } from './queries/databaseAdmin';
import { troubleshootingQueries } from './queries/troubleshooting';
import { bestPracticesQueries } from './queries/bestPractices';

export const ALL_QUERIES: QuerySnippet[] = [
  ...performanceQueries,
  ...partitioningQueries,
  ...sqlAgentQueries,
  ...storedProceduresQueries,
  ...tablesSchemaQueries,
  ...dataOperationsQueries,
  ...developerUtilsQueries,
  ...databaseAdminQueries,
  ...troubleshootingQueries,
  ...bestPracticesQueries,
];

export function getQueryById(id: string): QuerySnippet | undefined {
  return ALL_QUERIES.find(q => q.id === id);
}

export function getQueriesByCategory(category: QueryCategory): QuerySnippet[] {
  return ALL_QUERIES.filter(q => q.category === category);
}

export function getRelatedQueries(query: QuerySnippet): QuerySnippet[] {
  if (!query.relatedQueryIds || query.relatedQueryIds.length === 0) {
    // Fallback: return up to 3 queries in the same category
    return ALL_QUERIES.filter(q => q.category === query.category && q.id !== query.id).slice(0, 3);
  }
  return ALL_QUERIES.filter(q => query.relatedQueryIds.includes(q.id));
}

export function getFeaturedQueries(): QuerySnippet[] {
  return ALL_QUERIES.filter(q => q.featured);
}
