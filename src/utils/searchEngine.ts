import { QuerySnippet } from '../types';

export interface SearchResult {
  snippet: QuerySnippet;
  score: number;
  matchedFields: string[];
}

export function searchQueries(queries: QuerySnippet[], queryText: string): QuerySnippet[] {
  const trimmed = queryText.trim().toLowerCase();
  if (!trimmed) return queries;

  const terms = trimmed.split(/\s+/).filter(Boolean);
  const results: SearchResult[] = [];

  for (const snippet of queries) {
    let score = 0;
    const matchedFields: string[] = [];

    const titleLower = snippet.title.toLowerCase();
    const descLower = snippet.description.toLowerCase();
    const catLower = snippet.category.toLowerCase();
    const tagsLower = snippet.tags.map(t => t.toLowerCase());
    const sqlLower = snippet.sql.toLowerCase();
    const notesLower = (snippet.notes || []).map(n => n.toLowerCase()).join(' ');

    // 1. Exact title phrase
    if (titleLower.includes(trimmed)) {
      score += 100;
      matchedFields.push('title');
    }

    // 2. Term-by-term scoring
    let allTermsFound = true;

    for (const term of terms) {
      let termFound = false;

      // Title
      if (titleLower.includes(term)) {
        score += 35;
        termFound = true;
        if (!matchedFields.includes('title')) matchedFields.push('title');
      }

      // Tags
      if (tagsLower.some(t => t.includes(term))) {
        score += 30;
        termFound = true;
        if (!matchedFields.includes('tags')) matchedFields.push('tags');
      }

      // Category / Subcategory
      if (catLower.includes(term) || (snippet.subcategory && snippet.subcategory.toLowerCase().includes(term))) {
        score += 20;
        termFound = true;
        if (!matchedFields.includes('category')) matchedFields.push('category');
      }

      // Description
      if (descLower.includes(term)) {
        score += 15;
        termFound = true;
        if (!matchedFields.includes('description')) matchedFields.push('description');
      }

      // SQL code
      if (sqlLower.includes(term)) {
        score += 10;
        termFound = true;
        if (!matchedFields.includes('sql')) matchedFields.push('sql');
      }

      // Notes
      if (notesLower.includes(term)) {
        score += 5;
        termFound = true;
        if (!matchedFields.includes('notes')) matchedFields.push('notes');
      }

      if (!termFound) {
        allTermsFound = false;
      }
    }

    // If all terms matched across fields or score is high
    if (allTermsFound || score >= 25) {
      if (allTermsFound) score += 40; // Bonus for multi-term coverage
      results.push({ snippet, score, matchedFields });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.map(r => r.snippet);
}
